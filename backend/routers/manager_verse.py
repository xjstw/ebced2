from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES

router = APIRouter(
    prefix="/manager-verse",
    tags=["Yönetici Ayet Hesaplama"]
)

# Request ve Response modelleri
class ManagerVerseRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class VerseAnalysis(BaseModel):
    verse_number: str
    arabic_text: str
    turkish_meaning: str
    surah_name: str
    ebced: int
    ebced_difference: int

class ManagerVerseResponse(BaseModel):
    mother_name: str
    mother_arabic: str
    mother_ebced: int
    mother_letters: List[LetterAnalysis]
    
    child_name: str
    child_arabic: str
    child_ebced: int
    child_letters: List[LetterAnalysis]
    
    total_ebced: int
    total_arabic_letters: int
    method1_verses: List[VerseAnalysis]
    method2_verses: List[VerseAnalysis]

# Global değişkenler
names_df = None
esma_df = None
quran_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame, quran: pd.DataFrame):
    global names_df, esma_df, quran_df
    names_df = names
    esma_df = esmas
    quran_df = quran

def analyze_name(name: str) -> tuple:
    """İsmin Arapça yazılışını ve harf analizini yapar"""
    arabic, ebced, result = convert_to_arabic_and_calculate_ebced(name, names_df, is_name=True)
    
    letters = []
    for letter in result['letters']:
        letters.append(LetterAnalysis(
            letter=letter['letter'],
            ebced=letter['ebced'],
            element=letter['element'],
            nurani_zulmani=letter['nurani_zulmani'],
            gender=letter['gender']
        ))
    
    return arabic, ebced, letters

def simplify_number(number: int) -> int:
    """Sayıyı basamaklarını toplayarak sadeleştirir"""
    while number > 114 or (number <= 114 and not quran_df[quran_df['surah_number'] == number].empty):
        number = sum(int(digit) for digit in str(number))
    return number

def count_arabic_letters(arabic_text: str) -> int:
    """Arapça metindeki harf sayısını hesaplar"""
    return len(arabic_text)

def find_verse_by_method1(mother_arabic: str, child_arabic: str, total_ebced: int) -> List[VerseAnalysis]:
    """1. Yönteme göre ayet bulma"""
    # Toplam harf sayısı sure numarası olacak
    total_letters = count_arabic_letters(mother_arabic) + count_arabic_letters(child_arabic)
    surah_number = total_letters

    # Ayet numarası toplam ebced değeri
    verse_number = total_ebced
    
    # Eğer ayet numarası çok büyükse sadeleştir
    while verse_number > 286:  # En uzun sure olan Bakara suresi 286 ayet
        verse_number = sum(int(digit) for digit in str(verse_number))

    print(f"\n1. Yöntem Hesaplama Detayları:")
    print(f"Anne ismi harf sayısı: {count_arabic_letters(mother_arabic)}")
    print(f"Çocuk ismi harf sayısı: {count_arabic_letters(child_arabic)}")
    print(f"Toplam harf sayısı (Sure No): {total_letters}")
    print(f"Toplam Ebced değeri: {total_ebced}")
    print(f"Sadeleştirilmiş ayet no: {verse_number}")
    print(f"Sadeleştirilmiş sure adı: {surah_number}")

    matching_verses = []
    if quran_df is not None:
        print(f"\nKuran DataFrame'i kontrol ediliyor:")
        print(f"Sütunlar: {quran_df.columns.tolist()}")
        print(f"Aranacak sure no: {surah_number}, ayet no: {verse_number}")
        
        verses = quran_df[
            (quran_df['surah_number'] == surah_number) & 
            (quran_df['verse_number'] == verse_number)
        ]
        
        print(f"Bulunan ayet sayısı: {len(verses)}")
        
        for _, verse in verses.iterrows():
            print(f"Ayet bulundu: {verse['surah_number']}:{verse['verse_number']}")
            print(f"Sure Adı: {verse['surah_name']}")
            print(f"Türkçe Meal: {verse['turkish_meaning']}")
            print(f"Arapça Metin: {verse['arabic_text']}")
            print(f"Metin tipi: {type(verse['arabic_text'])}")
            print(f"Metin uzunluğu: {len(str(verse['arabic_text']))}")
            print("-" * 50)
            
            matching_verses.append(
                VerseAnalysis(
                    verse_number=f"{verse['surah_number']}:{verse['verse_number']}",
                    arabic_text=str(verse['arabic_text']) if pd.notna(verse['arabic_text']) else "",
                    turkish_meaning=str(verse['turkish_meaning']) if pd.notna(verse['turkish_meaning']) else "",
                    surah_name=str(verse['surah_name']) if pd.notna(verse['surah_name']) else "",
                    ebced=int(verse['verse_ebced']) if pd.notna(verse['verse_ebced']) else 0,
                    ebced_difference=abs(total_ebced - (int(verse['verse_ebced']) if pd.notna(verse['verse_ebced']) else 0))
                )
            )

    return matching_verses

def find_verse_by_method2(mother_arabic: str, child_arabic: str, total_ebced: int) -> List[VerseAnalysis]:
    """2. Yönteme göre ayet bulma"""
    # Anne isminin harf sayısı sure numarası olacak
    surah_number = count_arabic_letters(mother_arabic)
    
    # Çocuk isminin harf sayısı ayet numarası olacak
    verse_number = count_arabic_letters(child_arabic)
    
    print(f"\n2. Yöntem Hesaplama Detayları:")
    print(f"Anne ismi harf sayısı (Sure No): {surah_number}")
    print(f"Çocuk ismi harf sayısı (Ayet No): {verse_number}")
    print(f"Toplam Ebced değeri: {total_ebced}")

    matching_verses = []
    if quran_df is not None:
        print(f"\nKuran DataFrame'i kontrol ediliyor:")
        print(f"Sütunlar: {quran_df.columns.tolist()}")
        print(f"Aranacak sure no: {surah_number}, ayet no: {verse_number}")
        
        verses = quran_df[
            (quran_df['surah_number'] == surah_number) & 
            (quran_df['verse_number'] == verse_number)
        ]
        
        print(f"Bulunan ayet sayısı: {len(verses)}")
        
        for _, verse in verses.iterrows():
            print(f"Ayet bulundu: {verse['surah_number']}:{verse['verse_number']}")
            print(f"Sure Adı: {verse['surah_name']}")
            print(f"Türkçe Meal: {verse['turkish_meaning']}")
            print(f"Arapça Metin: {verse['arabic_text']}")
            print(f"Metin tipi: {type(verse['arabic_text'])}")
            print(f"Metin uzunluğu: {len(str(verse['arabic_text']))}")
            print("-" * 50)
            
            matching_verses.append(
                VerseAnalysis(
                    verse_number=f"{verse['surah_number']}:{verse['verse_number']}",
                    arabic_text=str(verse['arabic_text']) if pd.notna(verse['arabic_text']) else "",
                    turkish_meaning=str(verse['turkish_meaning']) if pd.notna(verse['turkish_meaning']) else "",
                    surah_name=str(verse['surah_name']) if pd.notna(verse['surah_name']) else "",
                    ebced=int(verse['verse_ebced']) if pd.notna(verse['verse_ebced']) else 0,
                    ebced_difference=abs(total_ebced - (int(verse['verse_ebced']) if pd.notna(verse['verse_ebced']) else 0))
                )
            )

    return matching_verses

@router.post("/calculate")
async def calculate_manager_verse(request: ManagerVerseRequest) -> ManagerVerseResponse:
    try:
        print(f"\nYönetici Ayet Hesaplama başladı...")
        print(f"Gelen istek: anne={request.mother_name}, çocuk={request.child_name}")
        
        # Anne ismini analiz et
        print(f"Anne ismi analiz ediliyor: {request.mother_name}")
        mother_arabic, mother_ebced, mother_letters = analyze_name(request.mother_name)
        print(f"Anne ismi analizi tamamlandı: {mother_arabic} ({mother_ebced})")
        print(f"Anne harfleri: {[{'harf': l.letter, 'ebced': l.ebced} for l in mother_letters]}")
        
        # Çocuk ismini analiz et
        print(f"Çocuk ismi analiz ediliyor: {request.child_name}")
        child_arabic, child_ebced, child_letters = analyze_name(request.child_name)
        print(f"Çocuk ismi analizi tamamlandı: {child_arabic} ({child_ebced})")
        print(f"Çocuk harfleri: {[{'harf': l.letter, 'ebced': l.ebced} for l in child_letters]}")
        
        # Toplam ebced değeri ve harf sayısını hesapla
        total_ebced = mother_ebced + child_ebced
        total_arabic_letters = count_arabic_letters(mother_arabic) + count_arabic_letters(child_arabic)
        print(f"Toplam değerler hesaplandı - Ebced: {total_ebced}, Harf sayısı: {total_arabic_letters}")
        
        # Her iki yönteme göre ayetleri bul
        print("1. Yöntem ile ayet aranıyor...")
        method1_verses = find_verse_by_method1(mother_arabic, child_arabic, total_ebced)
        print(f"1. Yöntem sonucu: {len(method1_verses)} ayet bulundu")
        if method1_verses:
            print(f"Bulunan ayetler: {[v.verse_number for v in method1_verses]}")
        
        print("2. Yöntem ile ayet aranıyor...")
        method2_verses = find_verse_by_method2(mother_arabic, child_arabic, total_ebced)
        print(f"2. Yöntem sonucu: {len(method2_verses)} ayet bulundu")
        if method2_verses:
            print(f"Bulunan ayetler: {[v.verse_number for v in method2_verses]}")
        
        print("Response hazırlanıyor...")
        response = ManagerVerseResponse(
            mother_name=request.mother_name,
            mother_arabic=mother_arabic,
            mother_ebced=mother_ebced,
            mother_letters=mother_letters,
            
            child_name=request.child_name,
            child_arabic=child_arabic,
            child_ebced=child_ebced,
            child_letters=child_letters,
            
            total_ebced=total_ebced,
            total_arabic_letters=total_arabic_letters,
            method1_verses=method1_verses,
            method2_verses=method2_verses
        )
        print("İşlem başarıyla tamamlandı.")
        return response
        
    except Exception as e:
        print(f"Hata detayı: {str(e)}")
        print(f"Hata türü: {type(e)}")
        import traceback
        print(f"Hata stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e)) 