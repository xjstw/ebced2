from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced

router = APIRouter(
    prefix="/financial-blessing",
    tags=["Maddi Blokaj/Bolluk Bereket Rızık Analizi"]
)

# Global değişkenler
names_df = None
esma_df = None
quran_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame, quran: pd.DataFrame = None):
    """Veritabanlarını başlatır"""
    global names_df, esma_df, quran_df
    names_df = names
    esma_df = esmas
    quran_df = quran
    print(f"Financial Blessing router initialized with {len(names_df)} names, {len(esma_df)} esmas, and {len(quran_df) if quran_df is not None else 0} verses")

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class FinancialBlessingRequest(BaseModel):
    mother_name: str
    child_name: str

class FinancialBlessingResponse(BaseModel):
    mother_name: str
    mother_arabic: str
    mother_letters: List[LetterAnalysis]
    mother_letter_count: int
    mother_ebced: int
    
    child_name: str
    child_arabic: str
    child_letters: List[LetterAnalysis]
    child_letter_count: int
    child_ebced: int
    
    blessing_word: str = "وَفْرَة"  # Bolluk Bereket
    blessing_letters: List[LetterAnalysis]
    blessing_letter_count: int
    blessing_ebced: int = 291  # Sabit ebced değeri
    
    provision_word: str = "رِزْق"  # Rızık
    provision_letters: List[LetterAnalysis]
    provision_letter_count: int
    provision_ebced: int = 307  # Sabit ebced değeri
    
    healing_word: str = "شِفَا"  # Şifa - 4 harf
    healing_letters: List[LetterAnalysis]
    healing_letter_count: int
    healing_ebced: int = 382  # Şifa kelimesi ebced değeri
    
    total_letter_count: int
    total_ebced: int
    
    first_verse: dict  # {sure: int, ayet: int, sure_name: str, arabic_text: str, turkish_meaning: str}
    second_verse: dict  # {sure: int, ayet: int, sure_name: str, arabic_text: str, turkish_meaning: str}

def simplify_number(num: int) -> int:
    """Sayıyı basamaklarının toplamına indirger"""
    while num > 9:
        num = sum(int(digit) for digit in str(num))
    return num

@router.post("/analyze", response_model=FinancialBlessingResponse)
async def analyze_financial_blessing(request: FinancialBlessingRequest):
    try:
        # Anne adı analizi
        mother_arabic, _, mother_result = convert_to_arabic_and_calculate_ebced(request.mother_name, names_df, True)
        mother_letters = mother_result['letters']
        mother_letter_count = len(mother_letters)
        mother_ebced = mother_result['total_ebced']
        
        # Çocuk adı analizi
        child_arabic, _, child_result = convert_to_arabic_and_calculate_ebced(request.child_name, names_df, True)
        child_letters = child_result['letters']
        child_letter_count = len(child_letters)
        child_ebced = child_result['total_ebced']
        
        # Bolluk Bereket kelimesi analizi (وَفْرَة)
        blessing_letters = []
        for char in "وَفْرَة":
            _, _, char_result = convert_to_arabic_and_calculate_ebced(char)
            if char_result['letters']:
                blessing_letters.append(char_result['letters'][0])
        blessing_letter_count = len(blessing_letters)
        
        # Rızık kelimesi analizi (رِزْق)
        provision_letters = []
        for char in "رِزْق":
            _, _, char_result = convert_to_arabic_and_calculate_ebced(char)
            if char_result['letters']:
                provision_letters.append(char_result['letters'][0])
        provision_letter_count = len(provision_letters)
        
        # Şifa kelimesi analizi (شِفَا)
        healing_letters = []
        healing_chars = "شفاا"  # Son harf tekrar edilerek 4 harf olarak ayarlandı
        for char in healing_chars:
            _, _, char_result = convert_to_arabic_and_calculate_ebced(char)
            if char_result['letters']:
                healing_letters.append(char_result['letters'][0])
        healing_letter_count = 4  # Sabit olarak 4 harf
        
        # Toplam harf sayısı hesaplama
        total_letter_count = (mother_letter_count + child_letter_count + 
                            blessing_letter_count + provision_letter_count + 
                            healing_letter_count)
        
        # Toplam ebced değeri (sabit değerler kullanılıyor)
        total_ebced = mother_ebced + child_ebced + 291 + 307 + 382
        
        # 1. Önerilen ayet hesaplama
        # Sure numarası = toplam harf sayısı (21)
        # Ayet numarası = toplam ebced değeri (1492 -> 16 -> 7)
        first_verse_surah = total_letter_count
        first_verse_ayah = total_ebced
        
        # Ayet numarasını sadeleştirme
        while first_verse_ayah > 286:  # En uzun sure olan Bakara suresi 286 ayet
            temp = simplify_number(first_verse_ayah)
            if temp > 286:  # Eğer hala büyükse tekrar sadeleştir
                first_verse_ayah = simplify_number(temp)
            else:
                first_verse_ayah = temp
        
        # 2. Önerilen ayet hesaplama
        # Sure numarası = toplam ebced değeri (1492 -> 16)
        # Ayet numarası = toplam harf sayısı (21)
        second_verse_surah = total_ebced
        second_verse_ayah = total_letter_count
        
        # Sure numarasını sadeleştirme
        while second_verse_surah > 114:  # Kuran'da 114 sure var
            second_verse_surah = simplify_number(second_verse_surah)
        
        # Ayet numarasını sadeleştirme (gerekirse)
        if second_verse_ayah > 286:  # En uzun sure olan Bakara suresi 286 ayet
            temp = simplify_number(second_verse_ayah)
            if temp > 286:  # Eğer hala büyükse tekrar sadeleştir
                second_verse_ayah = simplify_number(temp)
        
        # Sure ve ayet bilgilerini al
        first_verse_data = quran_df[
            (quran_df['surah_number'] == first_verse_surah) & 
            (quran_df['verse_number'] == first_verse_ayah)
        ].iloc[0]
        
        second_verse_data = quran_df[
            (quran_df['surah_number'] == second_verse_surah) & 
            (quran_df['verse_number'] == second_verse_ayah)
        ].iloc[0]
        
        return FinancialBlessingResponse(
            mother_name=request.mother_name,
            mother_arabic=mother_arabic,
            mother_letters=mother_letters,
            mother_letter_count=mother_letter_count,
            mother_ebced=mother_ebced,
            
            child_name=request.child_name,
            child_arabic=child_arabic,
            child_letters=child_letters,
            child_letter_count=child_letter_count,
            child_ebced=child_ebced,
            
            blessing_letters=blessing_letters,
            blessing_letter_count=blessing_letter_count,
            
            provision_letters=provision_letters,
            provision_letter_count=provision_letter_count,
            
            healing_letters=healing_letters,
            healing_letter_count=healing_letter_count,
            
            total_letter_count=total_letter_count,
            total_ebced=total_ebced,
            
            first_verse={
                "sure": first_verse_surah, 
                "ayet": first_verse_ayah,
                "sure_name": first_verse_data['surah_name'],
                "arabic_text": first_verse_data['arabic_text'],
                "turkish_meaning": first_verse_data['turkish_meaning']
            },
            second_verse={
                "sure": second_verse_surah, 
                "ayet": second_verse_ayah,
                "sure_name": second_verse_data['surah_name'],
                "arabic_text": second_verse_data['arabic_text'],
                "turkish_meaning": second_verse_data['turkish_meaning']
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 