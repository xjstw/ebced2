from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES

router = APIRouter(
    prefix="/name-coaching",
    tags=["İsim Koçluğu"]
)

# Request ve Response modelleri
class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class NameAnalysis(BaseModel):
    name: str
    arabic: str
    ebced: int
    letters: List[LetterAnalysis]
    element_counts: Dict[str, int]
    dominant_element: str
    nurani_ratio: float
    gender_ratio: float

class ChildNameCoachingRequest(BaseModel):
    mother_name: str
    suggested_names: List[str]
    child_gender: Literal["male", "female"]

class NameCoachingRequest(BaseModel):
    mother_name: str
    father_name: str
    suggested_names: Optional[List[str]] = None

class PersonalNameCoachingRequest(BaseModel):
    current_name: str
    suggested_names: List[str]
    gender: Literal["male", "female"]
    criteria: Literal["gender", "element", "nurani"]
    preferred_element: Optional[str] = None

class NameCoachingResponse(BaseModel):
    mother_analysis: Optional[NameAnalysis]
    current_name_analysis: Optional[NameAnalysis]
    suggested_names_analysis: List[NameAnalysis]
    recommended_names: List[str]
    recommendation_reason: str
    warning_message: str

# Global değişkenler
names_df = None
esma_df = None

ELEMENT_FRIENDS = {
    'ATEŞ': ['ATEŞ', 'HAVA'],
    'HAVA': ['HAVA', 'ATEŞ'],
    'TOPRAK': ['TOPRAK', 'SU'],
    'SU': ['SU', 'TOPRAK']
}

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

def analyze_name(name: str) -> NameAnalysis:
    """İsmi analiz eder ve sonuçları döndürür"""
    arabic, ebced, result = convert_to_arabic_and_calculate_ebced(name, names_df, is_name=True)
    
    letters = []
    element_counts = {'ATEŞ': 0, 'HAVA': 0, 'TOPRAK': 0, 'SU': 0}
    nurani_count = 0
    eril_count = 0
    total_count = len(result['letters'])
    
    for letter in result['letters']:
        letter_analysis = LetterAnalysis(
            letter=letter['letter'],
            ebced=letter['ebced'],
            element=letter['element'],
            nurani_zulmani=letter['nurani_zulmani'],
            gender=letter['gender']
        )
        letters.append(letter_analysis)
        
        element_counts[letter['element']] += 1
        if letter['nurani_zulmani'] == 'N':
            nurani_count += 1
        if letter['gender'] == 'E':
            eril_count += 1
    
    # Baskın elementi bul
    dominant_element = max(element_counts.items(), key=lambda x: x[1])[0]
    
    # Oranları hesapla
    nurani_ratio = nurani_count / total_count if total_count > 0 else 0
    gender_ratio = eril_count / total_count if total_count > 0 else 0
    
    return NameAnalysis(
        name=name,
        arabic=arabic,
        ebced=ebced,
        letters=letters,
        element_counts=element_counts,
        dominant_element=dominant_element,
        nurani_ratio=nurani_ratio,
        gender_ratio=gender_ratio
    )

def find_compatible_names_for_child(mother_analysis: NameAnalysis, 
                                  suggested_names_analysis: List[NameAnalysis],
                                  child_gender: str) -> tuple[List[str], str, str]:
    """Çocuk için uyumlu isimleri bulur"""
    compatible_names = []
    incompatible_gender_names = []
    mother_element = mother_analysis.dominant_element
    friendly_elements = ELEMENT_FRIENDS[mother_element]
    
    # İsimleri kriterlere göre filtrele
    for name_analysis in suggested_names_analysis:
        element_compatible = name_analysis.dominant_element in friendly_elements
        has_high_nurani = name_analysis.nurani_ratio > 0.5
        gender_appropriate = (
            (child_gender == "female" and name_analysis.gender_ratio < 0.5) or
            (child_gender == "male" and name_analysis.gender_ratio > 0.5)
        )
        
        # Element ve nurani uyumu varsa
        if element_compatible and has_high_nurani:
            if gender_appropriate:
                compatible_names.append(name_analysis.name)
            else:
                incompatible_gender_names.append(name_analysis.name)
    
    # Eğer birden fazla uyumlu isim varsa, nurani oranına göre sırala
    if len(compatible_names) > 1:
        compatible_names.sort(
            key=lambda x: next(n.nurani_ratio for n in suggested_names_analysis if n.name == x),
            reverse=True
        )
    
    reason = f"Seçilen isimler anne ismi ({mother_analysis.name}) ile element uyumu göstermektedir. "
    reason += "İsimler nurani harflerin baskınlığına göre sıralanmıştır."

    warning = ""
    if incompatible_gender_names:
        warning = "Bu isim anne ismiyle kriter yönüyle uyumludur ancak çocuğun cinsiyeti ile uyumlu değildir! Bu durumda yeni isimlerle tekrar analiz yapmanız önerilmektedir."
    
    return compatible_names, reason, warning

def find_compatible_names_for_person(current_analysis: NameAnalysis,
                                   suggested_names_analysis: List[NameAnalysis],
                                   criteria: str,
                                   gender: str,
                                   preferred_element: Optional[str] = None) -> tuple[List[str], str]:
    """Kişisel isim değişikliği için uyumlu isimleri bulur"""
    compatible_names = []
    reason = ""
    
    if criteria == "gender":
        # Cinsiyet kriterine göre filtreleme
        target_ratio = 0.7 if gender == "male" else 0.3
        compatible_names = [
            n.name for n in suggested_names_analysis
            if (gender == "male" and n.gender_ratio > target_ratio) or
               (gender == "female" and n.gender_ratio < target_ratio)
        ]
        reason = f"{'Eril' if gender == 'male' else 'Dişil'} enerjisi baskın isimler seçilmiştir."
    
    elif criteria == "element" and preferred_element:
        # Element kriterine göre filtreleme
        compatible_names = [
            n.name for n in suggested_names_analysis
            if n.dominant_element == preferred_element
        ]
        reason = f"{preferred_element} elementi baskın isimler seçilmiştir."
    
    elif criteria == "nurani":
        # Nurani kriterine göre filtreleme
        compatible_names = [n.name for n in suggested_names_analysis]
        compatible_names.sort(
            key=lambda x: next(n.nurani_ratio for n in suggested_names_analysis if n.name == x),
            reverse=True
        )
        reason = "Nurani harfleri baskın isimler seçilmiştir."
    
    return compatible_names, reason

@router.post("/child-name", response_model=NameCoachingResponse)
async def analyze_child_name(request: ChildNameCoachingRequest):
    """Çocuk için isim koçluğu analizi yapar"""
    try:
        # Anne ismini analiz et
        mother_analysis = analyze_name(request.mother_name)
        
        # Önerilen isimleri analiz et
        suggested_names_analysis = [analyze_name(name) for name in request.suggested_names]
        
        # Uyumlu isimleri bul
        compatible_names, reason, warning = find_compatible_names_for_child(
            mother_analysis,
            suggested_names_analysis,
            request.child_gender
        )
        
        return NameCoachingResponse(
            mother_analysis=mother_analysis,
            current_name_analysis=None,
            suggested_names_analysis=suggested_names_analysis,
            recommended_names=compatible_names,
            recommendation_reason=reason,
            warning_message=warning
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/personal-name", response_model=NameCoachingResponse)
async def analyze_personal_name(request: PersonalNameCoachingRequest):
    """Kişisel isim değişikliği için analiz yapar"""
    try:
        # Mevcut ismi analiz et
        current_analysis = analyze_name(request.current_name)
        
        # Önerilen isimleri analiz et
        suggested_names_analysis = [analyze_name(name) for name in request.suggested_names]
        
        # Uyumlu isimleri bul
        compatible_names, reason = find_compatible_names_for_person(
            current_analysis,
            suggested_names_analysis,
            request.criteria,
            request.gender,
            request.preferred_element
        )
        
        return NameCoachingResponse(
            mother_analysis=None,
            current_name_analysis=current_analysis,
            suggested_names_analysis=suggested_names_analysis,
            recommended_names=compatible_names,
            recommendation_reason=reason,
            warning_message="Yeni alacağınız ismin sizi dengeye getirip enerjisinin çalışması için bu ismin günlük hayatta kullanılması gerekir. Aksi halde enerji geçişi sağlanmaz."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=NameCoachingResponse)
async def analyze_name_coaching(request: NameCoachingRequest):
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
        mother_nurani = analyze_nurani_letters(mother_letters)
        
        # Baba ismini analiz et
        father_arabic, father_ebced, father_result = convert_to_arabic_and_calculate_ebced(request.father_name, names_df, is_name=True)
        father_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in father_result['letters']
        ]
        father_nurani = analyze_nurani_letters(father_letters)
        
        # Anne ve baba isimlerinin analizlerini oluştur
        mother_analysis = analyze_name(request.mother_name)
        father_analysis = analyze_name(request.father_name)
        
        # Çocuk isim analizini oluştur
        child_name = request.mother_name[0] + request.father_name[1:]
        child_analysis = analyze_name(child_name)
        
        # Tüm isimlerin analizlerini bir listeye ekle
        all_analyses = [mother_analysis, father_analysis, child_analysis]
        
        # Uyumlu isimleri bul
        compatible_names = []
        for analysis in all_analyses:
            compatible_names.extend(find_compatible_names_for_person(
                analysis,
                all_analyses,
                "nurani",
                "male",
                None
            )[0])
        
        # Eğer birden fazla uyumlu isim varsa, nurani oranına göre sırala
        compatible_names.sort(
            key=lambda x: next(n.nurani_ratio for n in all_analyses if n.name == x),
            reverse=True
        )
        
        # Sonuçları oluştur
        result = NameCoachingResponse(
            mother_analysis=mother_analysis,
            current_name_analysis=None,
            suggested_names_analysis=all_analyses,
            recommended_names=compatible_names,
            recommendation_reason="Nurani harfleri baskın isimler seçilmiştir.",
            warning_message="Yeni alacağınız ismin sizi dengeye getirip enerjisinin çalışması için bu ismin günlük hayatta kullanılması gerekir. Aksi halde enerji geçişi sağlanmaz."
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 