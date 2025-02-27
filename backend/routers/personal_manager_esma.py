from fastapi import APIRouter, HTTPException
from models.schemas import NameAnalysis, LetterAnalysis, EsmaInfo
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES
from routers.personal_disease import analyze_nurani_letters
import pandas as pd
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

# Request ve Response modelleri
class PersonalManagerEsmaRequest(BaseModel):
    name: str

class PersonalManagerEsmaResponse(BaseModel):
    name_analysis: NameAnalysis
    selected_esma: EsmaInfo
    lower_esma: Optional[EsmaInfo]
    upper_esma: Optional[EsmaInfo]
    differences: dict[str, int]  # Farkları göstermek için

# Global değişkenler
names_df = None
esma_df = None

def init_dataframes(names_dataframe: pd.DataFrame = None, esma_dataframe: pd.DataFrame = None):
    """DataFrame'leri başlat"""
    global names_df, esma_df
    names_df = names_dataframe
    esma_df = esma_dataframe
    print(f"Personal Manager Esma router initialized with {len(names_df)} names and {len(esma_df)} esma values")

def find_name_in_database(name: str) -> tuple[str, int] | None:
    """İsmi veritabanında ara ve Arapça karşılığını ve ebced değerini döndür"""
    global names_df
    if names_df is None:
        raise HTTPException(status_code=500, detail="Veritabanı başlatılmamış")
    
    name = name.lower().strip()
    result = names_df[names_df['name'].str.lower() == name]
    if not result.empty:
        arabic = result.iloc[0]['arabic']
        ebced = result.iloc[0]['ebced']
        return arabic, int(ebced)
    return None

def analyze_name(name: str) -> NameAnalysis:
    """İsmi analiz et - önce veritabanında ara, yoksa çeviri yap"""
    db_result = find_name_in_database(name)
    
    if db_result:
        arabic, total_ebced = db_result
        print(f"Found {name} in database: {arabic} ({total_ebced})")
        # convert_to_arabic_and_calculate_ebced fonksiyonunu kullan
        _, _, result = convert_to_arabic_and_calculate_ebced(name, names_df)
        
        # Gelen letter listesini LetterAnalysis objelerine dönüştür
        letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in result['letters']
        ]
    else:
        arabic, total_ebced, result = convert_to_arabic_and_calculate_ebced(name, names_df, is_name=True)
        print(f"Translated {name}: {arabic} ({total_ebced})")
        
        # Gelen letter listesini LetterAnalysis objelerine dönüştür
        letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in result['letters']
        ]
    
    return NameAnalysis(
        name=name,
        arabic=arabic,
        total_ebced=total_ebced,
        letters=letters
    )

def find_nearest_esma(target_value: int) -> tuple[EsmaInfo | None, EsmaInfo | None, EsmaInfo, dict[str, int]]:
    """Hedef değere en yakın Esma'yı bul ve farkları hesapla"""
    global esma_df
    if esma_df is None:
        raise HTTPException(status_code=500, detail="Esma veritabanı başlatılmamış")
    
    # Tam eşleşme ara
    exact_match = esma_df[esma_df['ebced'] == target_value]
    if not exact_match.empty:
        row = exact_match.iloc[0]
        esma = EsmaInfo(
            name=row['esma'],
            arabic=row['arabic'],
            ebced=int(row['ebced']),
            meaning=row['meaning'] if 'meaning' in row else ''
        )
        return None, None, esma, {}
    
    # En yakın alt ve üst değerleri bul
    lower_esma = esma_df[esma_df['ebced'] < target_value].nlargest(1, 'ebced')
    upper_esma = esma_df[esma_df['ebced'] > target_value].nsmallest(1, 'ebced')
    
    # Alt ve üst Esma objelerini oluştur
    lower_info = None if lower_esma.empty else EsmaInfo(
        name=lower_esma.iloc[0]['esma'],
        arabic=lower_esma.iloc[0]['arabic'],
        ebced=int(lower_esma.iloc[0]['ebced']),
        meaning=lower_esma.iloc[0]['meaning'] if 'meaning' in lower_esma.iloc[0] else ''
    )
    
    upper_info = None if upper_esma.empty else EsmaInfo(
        name=upper_esma.iloc[0]['esma'],
        arabic=upper_esma.iloc[0]['arabic'],
        ebced=int(upper_esma.iloc[0]['ebced']),
        meaning=upper_esma.iloc[0]['meaning'] if 'meaning' in upper_esma.iloc[0] else ''
    )
    
    # Farkları hesapla
    differences = {}
    if lower_info:
        differences[lower_info.name] = target_value - lower_info.ebced
    if upper_info:
        differences[upper_info.name] = upper_info.ebced - target_value
    
    # En yakın olanı seç
    selected = lower_info if lower_info and (not upper_info or (target_value - lower_info.ebced) <= (upper_info.ebced - target_value)) else upper_info
    
    if not selected:
        raise HTTPException(status_code=404, detail="Uygun esma bulunamadı")
    
    return lower_info, upper_info, selected, differences

@router.post("/analyze", response_model=PersonalManagerEsmaResponse)
async def analyze_personal_manager_esma(request: PersonalManagerEsmaRequest):
    try:
        # İsmi analiz et
        name_arabic, name_ebced, name_result = convert_to_arabic_and_calculate_ebced(request.name, names_df, is_name=True)
        name_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in name_result['letters']
        ]
        name_nurani = analyze_nurani_letters(name_letters)
        
        # İsmi analiz et
        name_analysis = analyze_name(request.name)
        
        # En yakın Esma'yı bul
        lower_esma, upper_esma, selected_esma, differences = find_nearest_esma(name_analysis.total_ebced)
        
        return PersonalManagerEsmaResponse(
            name_analysis=name_analysis,
            selected_esma=selected_esma,
            lower_esma=lower_esma,
            upper_esma=upper_esma,
            differences=differences
        )
    except Exception as e:
        print(f"Error in analyze_personal_manager_esma: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 