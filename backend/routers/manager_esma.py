from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES

router = APIRouter(
    prefix="/manager-esma",
    tags=["Yönetici Esma Hesaplama"]
)

# Request ve Response modelleri
class ManagerEsmaRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class ManagerEsmaResponse(BaseModel):
    mother_name: str
    mother_name_arabic: str
    mother_name_ebced: int
    mother_name_letters: List[LetterAnalysis]
    
    child_name: str
    child_name_arabic: str
    child_name_ebced: int
    child_name_letters: List[LetterAnalysis]
    
    total_ebced: int
    selected_esma: str
    selected_esma_arabic: str
    selected_esma_ebced: int
    selected_esma_meaning: str
    ebced_difference: int

# Global değişkenler
names_df = None
esma_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

@router.post("/calculate", response_model=ManagerEsmaResponse)
async def calculate_manager_esma(request: ManagerEsmaRequest):
    try:
        print(f"İstek alındı: anne={request.mother_name}, çocuk={request.child_name}")
        
        # Anne ismini analiz et
        print("Anne ismi analiz ediliyor...")
        mother_arabic, mother_ebced, mother_result = convert_to_arabic_and_calculate_ebced(request.mother_name, names_df, is_name=True)
        print(f"Anne ismi analiz sonucu: arabic={mother_arabic}, ebced={mother_ebced}")
        print(f"Anne harfleri: {mother_result['letters']}")
        
        mother_letters = []
        for letter in mother_result['letters']:
            mother_letters.append(LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            ))
        
        # Çocuk ismini analiz et
        print("Çocuk ismi analiz ediliyor...")
        child_arabic, child_ebced, child_result = convert_to_arabic_and_calculate_ebced(request.child_name, names_df, is_name=True)
        print(f"Çocuk ismi analiz sonucu: arabic={child_arabic}, ebced={child_ebced}")
        print(f"Çocuk harfleri: {child_result['letters']}")
        
        child_letters = []
        for letter in child_result['letters']:
            child_letters.append(LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            ))
        
        # Toplam ebced değerini hesapla
        total_ebced = mother_ebced + child_ebced
        print(f"Toplam ebced: {total_ebced}")
        
        # En yakın esmayı bul
        print("En yakın esma aranıyor...")
        esma_name, esma_arabic, esma_ebced, esma_meaning, diff = find_closest_esma(total_ebced)
        print(f"Bulunan esma: name={esma_name}, arabic={esma_arabic}, ebced={esma_ebced}, diff={diff}")
        
        response = ManagerEsmaResponse(
            mother_name=request.mother_name,
            mother_name_arabic=mother_arabic,
            mother_name_ebced=mother_ebced,
            mother_name_letters=mother_letters,
            
            child_name=request.child_name,
            child_name_arabic=child_arabic,
            child_name_ebced=child_ebced,
            child_name_letters=child_letters,
            
            total_ebced=total_ebced,
            selected_esma=esma_name,
            selected_esma_arabic=esma_arabic,
            selected_esma_ebced=esma_ebced,
            selected_esma_meaning=esma_meaning,
            ebced_difference=diff
        )
        
        print("İşlem başarılı, yanıt dönülüyor...")
        return response
        
    except Exception as e:
        print(f"Hata detayı: {str(e)}")
        print(f"Hata türü: {type(e)}")
        import traceback
        print(f"Hata stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

def find_closest_esma(total_ebced: int) -> tuple:
    """Toplam ebced değerine en yakın esmayı bulur"""
    if esma_df is None:
        raise HTTPException(status_code=500, detail="Esma veritabanı yüklenemedi")
    
    # Ebced değerlerini sayıya çevir
    esma_df['ebced'] = pd.to_numeric(esma_df['ebced'], errors='coerce')
    
    # NaN değerleri temizle
    clean_df = esma_df.dropna(subset=['ebced', 'esma', 'arabic', 'meaning'])
    
    if clean_df.empty:
        raise HTTPException(status_code=404, detail="Uygun esma bulunamadı")
    
    # Tam eşleşme ara
    exact_match = clean_df[clean_df['ebced'] == total_ebced]
    if not exact_match.empty:
        row = exact_match.iloc[0]
        return (
            row['esma'],
            row['arabic'],
            int(row['ebced']),
            row['meaning'],
            0  # Fark 0
        )
    
    # En yakın değeri bul
    clean_df['difference'] = abs(clean_df['ebced'] - total_ebced)
    closest = clean_df.nsmallest(1, 'difference')
    
    if closest.empty:
        raise HTTPException(status_code=404, detail="Uygun esma bulunamadı")
    
    row = closest.iloc[0]
    return (
        row['esma'],
        row['arabic'],
        int(row['ebced']),
        row['meaning'],
        int(row['difference'])
    )

@router.post("/analyze", response_model=ManagerEsmaResponse)
async def analyze_manager_esma(request: ManagerEsmaRequest):
    try:
        # Anne ismini analiz et
        mother_arabic, mother_ebced, mother_result = convert_to_arabic_and_calculate_ebced(request.mother_name, names_df, is_name=True)
        mother_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in mother_result['letters']
        ]
        
        # Çocuk ismini analiz et
        child_arabic, child_ebced, child_result = convert_to_arabic_and_calculate_ebced(request.child_name, names_df, is_name=True)
        child_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in child_result['letters']
        ]
        
        # Toplam ebced değerini hesapla
        total_ebced = mother_ebced + child_ebced
        print(f"Toplam ebced: {total_ebced}")
        
        # En yakın esmayı bul
        print("En yakın esma aranıyor...")
        esma_name, esma_arabic, esma_ebced, esma_meaning, diff = find_closest_esma(total_ebced)
        print(f"Bulunan esma: name={esma_name}, arabic={esma_arabic}, ebced={esma_ebced}, diff={diff}")
        
        response = ManagerEsmaResponse(
            mother_name=request.mother_name,
            mother_name_arabic=mother_arabic,
            mother_name_ebced=mother_ebced,
            mother_name_letters=mother_letters,
            
            child_name=request.child_name,
            child_name_arabic=child_arabic,
            child_name_ebced=child_ebced,
            child_name_letters=child_letters,
            
            total_ebced=total_ebced,
            selected_esma=esma_name,
            selected_esma_arabic=esma_arabic,
            selected_esma_ebced=esma_ebced,
            selected_esma_meaning=esma_meaning,
            ebced_difference=diff
        )
        
        print("İşlem başarılı, yanıt dönülüyor...")
        return response
        
    except Exception as e:
        print(f"Hata detayı: {str(e)}")
        print(f"Hata türü: {type(e)}")
        import traceback
        print(f"Hata stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e)) 