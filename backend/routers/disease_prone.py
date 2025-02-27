from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES
from pyarabic import araby

router = APIRouter(
    prefix="/disease-prone",
    tags=["Hastalığa Yatkınlık"]
)

# Request ve Response modelleri
class DiseaseProneMemberRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class PersonAnalysis(BaseModel):
    name: str
    arabic: str
    ebced: int
    letters: List[LetterAnalysis]
    element_counts: Dict[str, int]
    nurani_ratio: float
    gender_ratio: float

class DiseaseProneMemberResponse(BaseModel):
    mother: PersonAnalysis
    child: PersonAnalysis
    total_ebced: int
    remainder: int
    disease_type: str
    disease_description: str

# Global değişkenler
names_df = None
esma_df = None

DISEASE_MAP = {
    1: ("Baş bölgesi", "Baş bölgesi ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    2: ("Boğaz bölgesi", "Boğaz bölgesi ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    3: ("Göğüs bölgesi", " Göğüs bölgesi ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    4: ("Üst Karın bölgesi", "Üst karın bölgesi ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    5: ("Alt Karın bölgesi", "Alt karın bölgesi ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    6: ("Bacaklar", "Bacaklar ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    7: ("Ayaklar", "Ayaklar ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)"),
    0: ("Ayaklar", "Ayaklar ile ilgili hastalıklara yatkınlık mevcut (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız.)")
}

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

def analyze_person(name: str) -> tuple[str, int, List[LetterAnalysis], Dict[str, int], float, float]:
    """Kişinin ismini analiz eder"""
    arabic, ebced, result = convert_to_arabic_and_calculate_ebced(name, names_df, is_name=True)
    
    letters = []
    element_counts = {'ATEŞ': 0, 'HAVA': 0, 'TOPRAK': 0, 'SU': 0}
    nurani_count = 0
    eril_count = 0
    total_count = len(result['letters'])
    
    for letter in result['letters']:
        # Harf analizini ekle
        letter_analysis = LetterAnalysis(
            letter=letter['letter'],
            ebced=letter['ebced'],
            element=letter['element'],
            nurani_zulmani=letter['nurani_zulmani'],
            gender=letter['gender']
        )
        letters.append(letter_analysis)
        
        # Element sayımı
        element_counts[letter['element']] += 1
        
        # Nurani/Zulmani sayımı
        if letter['nurani_zulmani'] == 'N':
            nurani_count += 1
            
        # Eril/Dişil sayımı
        if letter['gender'] == 'E':
            eril_count += 1
    
    # Oranları hesapla
    nurani_ratio = nurani_count / total_count if total_count > 0 else 0
    gender_ratio = eril_count / total_count if total_count > 0 else 0
    
    return arabic, ebced, letters, element_counts, nurani_ratio, gender_ratio

@router.post("/analyze", response_model=DiseaseProneMemberResponse)
async def analyze_disease_prone(request: DiseaseProneMemberRequest):
    try:
        # Anne ismi analizi
        mother_arabic, mother_ebced, mother_letters, mother_elements, mother_nurani, mother_gender = analyze_person(request.mother_name)
        mother = PersonAnalysis(
            name=request.mother_name,
            arabic=mother_arabic,
            ebced=mother_ebced,
            letters=mother_letters,
            element_counts=mother_elements,
            nurani_ratio=mother_nurani,
            gender_ratio=mother_gender
        )
        
        # Çocuk ismi analizi
        child_arabic, child_ebced, child_letters, child_elements, child_nurani, child_gender = analyze_person(request.child_name)
        child = PersonAnalysis(
            name=request.child_name,
            arabic=child_arabic,
            ebced=child_ebced,
            letters=child_letters,
            element_counts=child_elements,
            nurani_ratio=child_nurani,
            gender_ratio=child_gender
        )
        
        # Toplam ebced değerini hesapla
        total_ebced = mother_ebced + child_ebced
        
        # 7'ye böl ve kalanı al
        remainder = total_ebced % 7
        
        # Hastalık türünü ve açıklamasını al
        disease_type, disease_description = DISEASE_MAP[remainder]
        
        return DiseaseProneMemberResponse(
            mother=mother,
            child=child,
            total_ebced=total_ebced,
            remainder=remainder,
            disease_type=disease_type,
            disease_description=disease_description
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 