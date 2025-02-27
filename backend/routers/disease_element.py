from fastapi import APIRouter, HTTPException
from models.schemas import NameAnalysis, LetterAnalysis, EsmaInfo
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel

router = APIRouter(
    prefix="/disease-element",
    tags=["Hastalık Element Hesaplama"]
)

# Request ve Response modelleri
class DiseaseElementRequest(BaseModel):
    name: str
    mother_name: str
    disease_type: str
    target_element: str  # ATEŞ, HAVA, TOPRAK, SU

class LetterAnalysis(BaseModel):
    letter: str
    arabic: str
    ebced: int
    element: str
    is_nurani: bool
    gender: str

class NameAnalysis(BaseModel):
    name: str
    arabic: str
    ebced: int
    letters: List[LetterAnalysis]

class EsmaAnalysis(BaseModel):
    name: str
    arabic: str
    ebced: int
    meaning: str
    element_counts: Dict[str, int]
    dominant_element: str
    ebced_difference: int

class DiseaseElementResponse(BaseModel):
    person_name_analysis: NameAnalysis
    mother_name_analysis: NameAnalysis
    total_ebced: int
    disease_type: str
    target_element: str
    matching_esmas: List[EsmaAnalysis]

# Global değişkenler
names_df = None
esma_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

def analyze_name(name: str) -> tuple:
    """İsmin Arapça yazılışını ve harf analizini yapar"""
    arabic, ebced, letters_data = convert_to_arabic_and_calculate_ebced(name, names_df)
    
    letters = []
    for letter in letters_data['letters']:
        letters.append(LetterAnalysis(
            letter=letter['letter'],
            arabic=letter['arabic'],
            ebced=letter['ebced'],
            element=letter['element'],
            is_nurani=letter['is_nurani'],
            gender=letter['gender']
        ))
    
    return arabic, ebced, letters

def analyze_esma_elements(arabic_text: str) -> Dict[str, int]:
    """Bir esmanın element dağılımını analiz et (sadece nurani harfler)"""
    element_counts = {'ATEŞ': 0, 'HAVA': 0, 'TOPRAK': 0, 'SU': 0}
    
    for char in arabic_text:
        for props in LETTER_PROPERTIES.values():
            if props.arabic == char and props.is_nurani:  # Sadece nurani harfleri say
                element_counts[props.element] += 1
                break
    
    return element_counts

def find_dominant_element(element_counts: Dict[str, int]) -> str:
    """Element sayılarına göre baskın elementi bul"""
    max_count = max(element_counts.values())
    if max_count == 0:
        return "Baskın element yok"
    
    dominant_elements = [e for e, c in element_counts.items() if c == max_count]
    return dominant_elements[0] if dominant_elements else "Baskın element yok"

def find_matching_esmas(name_ebced: int, target_element: str, tolerance: int = 100) -> List[EsmaAnalysis]:
    """Ebced değerine yakın ve hedef elementi baskın olan esmaları bul"""
    if esma_df is None:
        raise HTTPException(status_code=500, detail="Esma veritabanı yüklenemedi")
    
    print(f"\nAranan ebced değeri: {name_ebced}")
    print(f"Hedef element: {target_element}")
    print("\nEsma DataFrame içeriği:")
    print(f"Sütunlar: {esma_df.columns.tolist()}")
    print(f"Satır sayısı: {len(esma_df)}")
    
    # Ebced değerlerini sayıya çevir
    esma_df['ebced'] = pd.to_numeric(esma_df['ebced'], errors='coerce')
    
    # NaN değerleri temizle
    clean_df = esma_df.dropna(subset=['ebced', 'esma', 'arabic', 'meaning'])
    
    if clean_df.empty:
        raise HTTPException(status_code=404, detail="Uygun esma bulunamadı")
    
    matching_esmas = []
    
    # Ebced farkını hesapla
    clean_df['difference'] = abs(clean_df['ebced'] - name_ebced)
    
    # Tolerans içindeki esmaları al ve ebced farkına göre sırala
    candidates = clean_df[clean_df['difference'] <= tolerance].sort_values('difference')
    
    if candidates.empty:
        # Toleransı artırarak tekrar dene
        tolerance = tolerance * 2
        candidates = clean_df[clean_df['difference'] <= tolerance].sort_values('difference')
        if candidates.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"Ebced değerine ({name_ebced}) yakın esma bulunamadı"
            )
    
    print("\nAday esmalar:")
    print(candidates[['esma', 'arabic', 'ebced', 'difference']].head())
    
    # Her esma için element dağılımını hesapla
    for _, row in candidates.iterrows():
        # Element dağılımını hesapla
        element_counts = analyze_esma_elements(row['arabic'])
        
        # Baskın elementi bul
        dominant_element = find_dominant_element(element_counts)
        
        print(f"\nEsma: {row['esma']}")
        print(f"Element dağılımı: {element_counts}")
        print(f"Baskın element: {dominant_element}")
        
        # Hedef element baskınsa veya eşit dağılım varsa listeye ekle
        if dominant_element == target_element or (element_counts[target_element] > 0 and max(element_counts.values()) == element_counts[target_element]):
            matching_esmas.append(EsmaAnalysis(
                name=row['esma'],
                arabic=row['arabic'],
                ebced=int(row['ebced']),
                meaning=row['meaning'],
                element_counts=element_counts,
                dominant_element=dominant_element,
                ebced_difference=int(row['difference'])
            ))
    
    # Ebced farkına göre sırala
    matching_esmas.sort(key=lambda x: x.ebced_difference)
    
    if not matching_esmas:
        # İkinci bir deneme - sadece hedef elementi içeren esmaları al
        for _, row in candidates.iterrows():
            element_counts = analyze_esma_elements(row['arabic'])
            if element_counts[target_element] > 0:
                dominant_element = find_dominant_element(element_counts)
                matching_esmas.append(EsmaAnalysis(
                    name=row['esma'],
                    arabic=row['arabic'],
                    ebced=int(row['ebced']),
                    meaning=row['meaning'],
                    element_counts=element_counts,
                    dominant_element=dominant_element,
                    ebced_difference=int(row['difference'])
                ))
    
    if not matching_esmas:
        raise HTTPException(
            status_code=404,
            detail=f"Ebced değerine ({name_ebced}) yakın ve {target_element} elementi içeren esma bulunamadı"
        )
    
    print(f"\nEşleşen esma sayısı: {len(matching_esmas)}")
    for esma in matching_esmas[:3]:
        print(f"- {esma.name} ({esma.ebced}): {esma.dominant_element}")
    
    return matching_esmas[:10]  # En iyi 10 eşleşmeyi döndür

@router.post("/calculate", response_model=DiseaseElementResponse)
async def calculate_disease_element(request: DiseaseElementRequest):
    try:
        # Kişinin ismini analiz et
        name_arabic, name_ebced, name_letters = analyze_name(request.name)
        person_name_analysis = NameAnalysis(
            name=request.name,
            arabic=name_arabic,
            ebced=name_ebced,
            letters=name_letters
        )
        
        # Anne ismini analiz et
        mother_arabic, mother_ebced, mother_letters = analyze_name(request.mother_name)
        mother_name_analysis = NameAnalysis(
            name=request.mother_name,
            arabic=mother_arabic,
            ebced=mother_ebced,
            letters=mother_letters
        )
        
        # Toplam ebced değerini hesapla
        total_ebced = name_ebced + mother_ebced
        
        # Hedef elemente göre uygun esmaları bul
        matching_esmas = find_matching_esmas(total_ebced, request.target_element)
        
        return DiseaseElementResponse(
            person_name_analysis=person_name_analysis,
            mother_name_analysis=mother_name_analysis,
            total_ebced=total_ebced,
            disease_type=request.disease_type,
            target_element=request.target_element,
            matching_esmas=matching_esmas
        )
        
    except Exception as e:
        import traceback
        print(f"Hata: {str(e)}")
        print("Detaylı hata:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 