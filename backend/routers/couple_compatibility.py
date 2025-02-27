from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES
from pyarabic import araby

router = APIRouter(
    prefix="/couple-compatibility",
    tags=["Çift Uyumu"]
)

# Request ve Response modelleri
class CoupleCompatibilityRequest(BaseModel):
    female_name: str
    male_name: str

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

class CoupleCompatibilityResponse(BaseModel):
    male: PersonAnalysis
    female: PersonAnalysis
    total_ebced: int
    total_with_seven: int
    remainder: int
    compatibility: str
    compatibility_level: str

# Global değişkenler
names_df = None
esma_df = None

COMPATIBILITY_MAP = {
    5: ("Gayet uyumlu bir çift", "Yüksek"),
    7: ("Gayet uyumlu bir çift", "Yüksek"),
    1: ("Orta uyumlu", "Orta"),
    2: ("Orta uyumlu", "Orta"),
    8: ("Orta uyumlu", "Orta"),
    3: ("İlk başta gayet güzel giden sonrası problemli olabilir Dikkat! (Kişiler eğer mizaçlarının dengesindeyse ve ilişkilerinde sevgi, saygı ve anlayış içerisinde bir tutum sergiliyorlarsa o ilişkinin gayet güzel bir şekilde yürüyebileceğidir. O nedenle tarafların mizacında dengeye gelmesi ilişkilerini huzura kavuşturur Allah’ın izniyle)", "Düşük"),
    4: ("Ayrılma ihtimalleri düşük olsa da stresli geçen evlilik süreci (Kişiler eğer mizaçlarının dengesindeyse ve ilişkilerinde sevgi, saygı ve anlayış içerisinde bir tutum sergiliyorlarsa o ilişkinin gayet güzel bir şekilde yürüyebileceğidir. O nedenle tarafların mizacında dengeye gelmesi ilişkilerini huzura kavuşturur Allah’ın izniyle)", "Düşük"),
    6: ("Birbirlerini yıpratabilirler o nedenle çok fazla önerilmez! (Sonuç olumsuz gibi görünebilir ancak bu sonuçlar yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız. Sadece dikkatli olunması gerektiğini gösterir. Bununla beraber eğer çiftler ilişkilerinde öz verili ve dengeli olurlarsa Allah’ın izniyle her şeyin üstesinden gelebilirler. Kimseye olumsuz yorum yaparak ilişkilerine müdahale de bulunmayın. Aksi takdirde kişilerin kaderine (karmasına) müdahale etmiş olursunuz.)", "Çok Düşük"),
    9: ("Birbirlerini yıpratabilirler o nedenle çok fazla önerilmez! (Sonuç olumsuz gibi görünebilir ancak bu sonuçlar yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız. Sadece dikkatli olunması gerektiğini gösterir. Bununla beraber eğer çiftler ilişkilerinde öz verili ve dengeli olurlarsa Allah’ın izniyle her şeyin üstesinden gelebilirler. Kimseye olumsuz yorum yaparak ilişkilerine müdahale de bulunmayın. Aksi takdirde kişilerin kaderine (karmasına) müdahale etmiş olursunuz.)", "Çok Düşük"),
    0: ("Birbirlerini yıpratabilirler o nedenle çok fazla önerilmez!  (Sonuç olumsuz gibi görünebilir ancak bu sonuçlar yalnızca ihtimalleri verir. O nedenle sonuçlara bakarak endişeye kapılmamalısınız. Sadece dikkatli olunması gerektiğini gösterir. Bununla beraber eğer çiftler ilişkilerinde öz verili ve dengeli olurlarsa Allah’ın izniyle her şeyin üstesinden gelebilirler. Kimseye olumsuz yorum yaparak ilişkilerine müdahele de bulunmayın. Aksi takdirde kişilerin kaderine (karmasına) müdahale etmiş olursunuz.)", "Çok Düşük")
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

@router.post("/calculate", response_model=CoupleCompatibilityResponse)
async def calculate_compatibility(request: CoupleCompatibilityRequest):
    try:
        # Erkek analizi
        male_arabic, male_ebced, male_letters, male_elements, male_nurani, male_gender = analyze_person(request.male_name)
        male = PersonAnalysis(
            name=request.male_name,
            arabic=male_arabic,
            ebced=male_ebced,
            letters=male_letters,
            element_counts=male_elements,
            nurani_ratio=male_nurani,
            gender_ratio=male_gender
        )
        
        # Kadın analizi
        female_arabic, female_ebced, female_letters, female_elements, female_nurani, female_gender = analyze_person(request.female_name)
        female = PersonAnalysis(
            name=request.female_name,
            arabic=female_arabic,
            ebced=female_ebced,
            letters=female_letters,
            element_counts=female_elements,
            nurani_ratio=female_nurani,
            gender_ratio=female_gender
        )
        
        # Toplam ebced değerini hesapla
        total_ebced = male_ebced + female_ebced
        
        # 7 ekle
        total_with_seven = total_ebced + 7
        
        # 9'a böl ve kalanı al
        remainder = total_with_seven % 9
        
        # Uyumluluk sonucunu al
        compatibility, compatibility_level = COMPATIBILITY_MAP[remainder]
        
        return CoupleCompatibilityResponse(
            male=male,
            female=female,
            total_ebced=total_ebced,
            total_with_seven=total_with_seven,
            remainder=remainder,
            compatibility=compatibility,
            compatibility_level=compatibility_level
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=CoupleCompatibilityResponse)
async def analyze_couple_compatibility(request: CoupleCompatibilityRequest):
    try:
        # İlk ismi analiz et
        name1_arabic, name1_ebced, name1_result = convert_to_arabic_and_calculate_ebced(request.male_name, names_df, is_name=True)
        name1_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in name1_result['letters']
        ]
        name1_nurani = analyze_nurani_letters(name1_letters)
        
        # İkinci ismi analiz et
        name2_arabic, name2_ebced, name2_result = convert_to_arabic_and_calculate_ebced(request.female_name, names_df, is_name=True)
        name2_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in name2_result['letters']
        ]
        name2_nurani = analyze_nurani_letters(name2_letters)
        
        # Erkek analizi
        male_arabic, male_ebced, male_letters, male_elements, male_nurani_ratio, male_gender_ratio = analyze_person(request.male_name)
        male = PersonAnalysis(
            name=request.male_name,
            arabic=male_arabic,
            ebced=male_ebced,
            letters=male_letters,
            element_counts=male_elements,
            nurani_ratio=male_nurani_ratio,
            gender_ratio=male_gender_ratio
        )
        
        # Kadın analizi
        female_arabic, female_ebced, female_letters, female_elements, female_nurani_ratio, female_gender_ratio = analyze_person(request.female_name)
        female = PersonAnalysis(
            name=request.female_name,
            arabic=female_arabic,
            ebced=female_ebced,
            letters=female_letters,
            element_counts=female_elements,
            nurani_ratio=female_nurani_ratio,
            gender_ratio=female_gender_ratio
        )
        
        # Toplam ebced değerini hesapla
        total_ebced = male_ebced + female_ebced
        
        # 7 ekle
        total_with_seven = total_ebced + 7
        
        # 9'a böl ve kalanı al
        remainder = total_with_seven % 9
        
        # Uyumluluk sonucunu al
        compatibility, compatibility_level = COMPATIBILITY_MAP[remainder]
        
        return CoupleCompatibilityResponse(
            male=male,
            female=female,
            total_ebced=total_ebced,
            total_with_seven=total_with_seven,
            remainder=remainder,
            compatibility=compatibility,
            compatibility_level=compatibility_level
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 