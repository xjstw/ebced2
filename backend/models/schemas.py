from pydantic import BaseModel
from typing import Optional, Dict, List

class NameRequest(BaseModel):
    name: str

class EsmaInfo(BaseModel):
    ebced: int
    name: str
    arabic: str
    meaning: str

class NameResponse(BaseModel):
    name: str
    arabic: str
    ebced: int
    is_calculated: bool  # Veritabanından mı yoksa hesaplanarak mı bulundu
    nearest_match: Optional[EsmaInfo] = None

class EsmaValue(BaseModel):
    name: str
    ebced: int
    arabic: str
    element: str
    coefficient: int

class DiseaseResponse(BaseModel):
    elements: Dict[str, int]  # Element değerleri
    element_ebced: Dict[str, int]  # Elementlerin ebced değerleri
    esma_values: List[EsmaValue]  # Her esma için değerler
    total_score: float  # Toplam skor 

class ManagerEsmaRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str  # eril/dişil

class NameAnalysis(BaseModel):
    arabic: str
    letters: list[LetterAnalysis]
    total_ebced: int

class ManagerEsmaResponse(BaseModel):
    mother_analysis: NameAnalysis
    child_analysis: NameAnalysis
    combined_ebced: int
    selected_esma: EsmaInfo
    lower_esma: Optional[EsmaInfo]
    upper_esma: Optional[EsmaInfo]

class VerseRecommendation(BaseModel):
    surah_number: int
    verse_number: int
    surah_name: str
    arabic_text: str
    turkish_meaning: str

class VerseAnalysis(BaseModel):
    verse_number: str
    arabic_text: str
    turkish_meaning: str
    surah_name: str
    ebced: int
    ebced_difference: int 