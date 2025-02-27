from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced
import pandas as pd

router = APIRouter(prefix="/spiritual-issues", tags=["Manevi Sıkıntılara Yatkınlık Hesaplama"])

class SpiritualIssuesRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    arabic: str

class SpiritualIssuesResponse(BaseModel):
    mother_name: str
    mother_arabic: str
    mother_ebced: int
    mother_letters: list[LetterAnalysis]
    child_name: str
    child_arabic: str
    child_ebced: int
    child_letters: list[LetterAnalysis]
    total_ebced: int
    remainder: int
    issue_type: str
    issue_description: str

ISSUE_MAP = {
    1: ("Fiziksel Sıkıntılar", "Vücutta ağrı, sızı, yorgunluk gibi fiziksel belirtiler görülebilir."),
    2: ("Nazar", "Başkalarının olumsuz bakışlarından etkilenmeye yatkınlık vardır."),
    3: ("Sihir", "Büyü ve sihir gibi olumsuz etkilere karşı hassasiyet görülebilir."),
    4: ("Düşük Enerji", "Sürekli yorgunluk, isteksizlik ve enerji düşüklüğü yaşanabilir."),
    5: ("Yel veya Romatizma", "Eklem ağrıları ve romatizmal rahatsızlıklara yatkınlık vardır."),
    0: ("Yel veya Romatizma", "Eklem ağrıları ve romatizmal rahatsızlıklara yatkınlık vardır.")
}

# Global değişkenler
names_df = None
esma_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

@router.post("/calculate")
async def calculate_spiritual_issues(request: SpiritualIssuesRequest) -> SpiritualIssuesResponse:
    try:
        # Analyze mother's name
        mother_arabic, mother_ebced, mother_elements = convert_to_arabic_and_calculate_ebced(request.mother_name, names_df)
        mother_letters = []
        for letter in mother_elements['letters']:
            mother_letters.append(
                LetterAnalysis(
                    letter=letter['letter'],
                    ebced=letter['ebced'],
                    arabic=letter['arabic']
                )
            )
        
        # Analyze child's name
        child_arabic, child_ebced, child_elements = convert_to_arabic_and_calculate_ebced(request.child_name, names_df)
        child_letters = []
        for letter in child_elements['letters']:
            child_letters.append(
                LetterAnalysis(
                    letter=letter['letter'],
                    ebced=letter['ebced'],
                    arabic=letter['arabic']
                )
            )
        
        # Calculate total ebced and remainder
        total_ebced = mother_ebced + child_ebced
        remainder = total_ebced % 5
        
        # Get corresponding issue type and description
        issue_type, issue_description = ISSUE_MAP[remainder]
        
        return SpiritualIssuesResponse(
            mother_name=request.mother_name,
            mother_arabic=mother_arabic,
            mother_ebced=mother_ebced,
            mother_letters=mother_letters,
            child_name=request.child_name,
            child_arabic=child_arabic,
            child_ebced=child_ebced,
            child_letters=child_letters,
            total_ebced=total_ebced,
            remainder=remainder,
            issue_type=issue_type,
            issue_description=issue_description
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 