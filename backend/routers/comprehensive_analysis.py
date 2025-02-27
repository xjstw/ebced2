from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import os
from datetime import datetime
from fastapi.responses import StreamingResponse

# Diğer router'ları import et
from routers.manager_esma import router as manager_esma_router, ManagerEsmaRequest, calculate_manager_esma
from routers.personal_manager_esma import router as personal_manager_router, PersonalManagerEsmaRequest, analyze_personal_manager_esma
from routers.manager_verse import router as verse_router, ManagerVerseRequest, calculate_manager_verse
from routers.disease_prone import router as disease_prone_router, DiseaseProneMemberRequest, analyze_disease_prone as analyze_prone_risk
from routers.magic_analysis import router as magic_router, MagicAnalysisRequest, analyze_magic_risk
from routers.personal_disease import router as disease_router, PersonalDiseaseRequest, analyze_personal_disease, analyze_nurani_letters
from routers.financial_blessing import router as financial_blessing_router, FinancialBlessingRequest, analyze_financial_blessing

# Response ve Request modelleri
class ComprehensiveRequest(BaseModel):
    mother_name: str
    child_name: str
    disease_name: str

class AnalysisResult(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

class ComprehensiveResponse(BaseModel):
    message: str
    mother_name: str
    child_name: str
    disease_name: str
    manager_esma_analysis: AnalysisResult
    personal_manager_analysis: AnalysisResult
    manager_verse_analysis: AnalysisResult
    disease_analysis: AnalysisResult
    magic_analysis: AnalysisResult
    disease_prone_analysis: AnalysisResult
    financial_blessing_analysis: AnalysisResult

class PDFGenerationRequest(BaseModel):
    mother_name: str
    child_name: str
    disease_name: str
    manager_esma_analysis: AnalysisResult
    personal_manager_analysis: AnalysisResult
    manager_verse_analysis: AnalysisResult
    disease_analysis: AnalysisResult
    magic_analysis: AnalysisResult
    disease_prone_analysis: AnalysisResult
    financial_blessing_analysis: AnalysisResult

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
    print(f"Comprehensive Analysis router initialized with {len(names_df)} names, {len(esma_df)} esmas, and {len(quran_df) if quran_df is not None else 0} verses")

router = APIRouter(
    prefix="/comprehensive-analysis",
    tags=["Kapsamlı Analiz"]
)

async def analyze_manager_esma(data: dict):
    """Yönetici Esma analizi yapar"""
    try:
        request = ManagerEsmaRequest(
            mother_name=data["mother_name"],
            child_name=data["child_name"]
        )
        result = await calculate_manager_esma(request)
        return result.dict()  # Pydantic modeli dict'e çevir
    except Exception as e:
        print(f"Yönetici Esma analizinde hata: {str(e)}")
        raise

async def analyze_personal_manager(data: dict):
    """Kişisel Yönetici Esma analizi yapar"""
    try:
        request = PersonalManagerEsmaRequest(name=data["child_name"])
        result = await analyze_personal_manager_esma(request)
        return result.dict()  # Pydantic modeli dict'e çevir
    except Exception as e:
        print(f"Kişisel Yönetici Esma analizinde hata: {str(e)}")
        raise

async def analyze_manager_verse(data: dict):
    """Yönetici Ayet analizi yapar"""
    try:
        request = ManagerVerseRequest(
            mother_name=data["mother_name"],
            child_name=data["child_name"]
        )
        result = await calculate_manager_verse(request)
        return result.dict()  # Pydantic modeli dict'e çevir
    except Exception as e:
        print(f"Yönetici Ayet analizinde hata: {str(e)}")
        raise

async def analyze_disease(data: dict):
    """Hastalık analizi yapar"""
    try:
        request = PersonalDiseaseRequest(
            mother_name=data["mother_name"],
            child_name=data["child_name"],
            disease_name=data["disease_name"]
        )
        result = await analyze_personal_disease(request)
        return result.dict()  # Pydantic modeli dict'e çevir
    except Exception as e:
        print(f"Hastalık analizinde hata: {str(e)}")
        raise

async def analyze_magic(data: dict):
    """Büyü analizi yapar"""
    try:
        request = MagicAnalysisRequest(
            mother_name=data["mother_name"],
            child_name=data["child_name"]
        )
        result = await analyze_magic_risk(request)
        return result.dict()  # Pydantic modeli dict'e çevir
    except Exception as e:
        print(f"Büyü analizinde hata: {str(e)}")
        raise

async def analyze_disease_prone(data: dict):
    """Hastalığa yatkınlık analizi yapar"""
    try:
        request = DiseaseProneMemberRequest(
            mother_name=data["mother_name"],
            child_name=data["child_name"]
        )
        result = await analyze_prone_risk(request)
        if result:
            return {
                "mother": result.mother.dict(),
                "child": result.child.dict(),
                "total_ebced": result.total_ebced,
                "remainder": result.remainder,
                "disease_type": result.disease_type,
                "disease_description": result.disease_description
            }
        return {}
    except Exception as e:
        print(f"Hastalığa yatkınlık analizinde hata: {str(e)}")
        raise

async def analyze_financial_blessing_risk(data: dict):
    """Maddi Blokaj/Bolluk Bereket Rızık analizi yapar"""
    try:
        request = FinancialBlessingRequest(
            mother_name=data["mother_name"],
            child_name=data["child_name"]
        )
        result = await analyze_financial_blessing(request)
        return {
            "success": True,
            "data": result.dict()
        }
    except Exception as e:
        print(f"Maddi Blokaj/Bolluk Bereket Rızık analizinde hata: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def create_pdf_report(
    mother_name: str,
    child_name: str,
    disease_name: str,
    manager_esma_result: dict,
    personal_manager_result: dict,
    manager_verse_result: dict,
    disease_query_result: dict,
    magic_analysis_result: dict,
    disease_prone_result: dict
) -> BytesIO:
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Varsayılan font kullan
        default_font = "Helvetica"
        default_font_bold = "Helvetica-Bold"
        
        try:
            # Türkçe font desteği için
            fonts_dir = os.path.join("static", "fonts")
            os.makedirs(fonts_dir, exist_ok=True)
            
            dejavu_regular = os.path.join(fonts_dir, "DejaVuSans.ttf")
            dejavu_bold = os.path.join(fonts_dir, "DejaVuSans-Bold.ttf")
            
            if os.path.exists(dejavu_regular) and os.path.exists(dejavu_bold):
                pdfmetrics.registerFont(TTFont('DejaVuSans', dejavu_regular))
                pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', dejavu_bold))
                default_font = "DejaVuSans"
                default_font_bold = "DejaVuSans-Bold"
        except Exception as e:
            print(f"Font yükleme hatası, varsayılan font kullanılacak: {str(e)}")
        
        # PDF başlığı
        c.setFont(default_font_bold, 24)
        c.drawString(50, height - 50, "Kapsamlı Analiz Raporu")
        c.setFont(default_font, 12)
        c.drawString(50, height - 70, f"Oluşturulma Tarihi: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        
        # Kişi bilgileri
        y = height - 100
        c.setFont(default_font_bold, 14)
        c.drawString(50, y, "Kişi Bilgileri:")
        c.setFont(default_font, 12)
        y -= 20
        c.drawString(50, y, f"Anne İsmi: {mother_name}")
        y -= 20
        c.drawString(50, y, f"Çocuk İsmi: {child_name}")
        y -= 20
        c.drawString(50, y, f"Hastalık: {disease_name}")

        def format_result_section(title: str, result: dict, y: int) -> int:
            y -= 40
            if y < 50:
                c.showPage()
                c.setFont(default_font, 12)
                y = height - 50

            c.setFont(default_font_bold, 14)
            c.drawString(50, y, title)
            c.setFont(default_font, 12)
            y -= 20

            if isinstance(result, dict) and "error" in result:
                if result["error"]:
                    c.setFillColorRGB(0.8, 0, 0)  # Kırmızımsı renk
                    c.drawString(50, y, f"Hata: {result['error']}")
                    c.setFillColorRGB(0, 0, 0)  # Siyah renge geri dön
                    y -= 20
                return y

            try:
                if hasattr(result, '__dict__'):
                    data = result.__dict__
                elif isinstance(result, dict):
                    data = result
                else:
                    data = {"değer": str(result)}

                for key, value in data.items():
                    if key.startswith('_') or value is None:
                        continue

                    # Özel alanları formatla
                    if isinstance(value, (str, int, float)):
                        if "arabic" in key.lower():
                            # Arapça metinler için özel format
                            c.drawString(50, y, f"{key}: {value}")
                        elif "ebced" in key.lower():
                            # Ebced değerleri için özel format
                            c.drawString(50, y, f"{key}: {value}")
                        elif "error" in key.lower():
                            if value:  # Sadece hata varsa göster
                                c.setFillColorRGB(0.8, 0, 0)
                                c.drawString(50, y, f"Hata: {value}")
                                c.setFillColorRGB(0, 0, 0)
                        else:
                            # Normal metin
                            c.drawString(50, y, f"{key}: {value}")
                        y -= 20

            except Exception as e:
                print(f"Bölüm formatlamada hata: {str(e)}")
                c.setFillColorRGB(0.8, 0, 0)
                c.drawString(50, y, f"Format hatası: {str(e)}")
                c.setFillColorRGB(0, 0, 0)
                y -= 20

            return y

        # Her bir analiz sonucunu ekle
        sections = [
            ("1. Yönetici Esma Analizi", manager_esma_result),
            ("2. Kişisel Yönetici Esma Analizi", personal_manager_result),
            ("3. Yönetici Ayet Analizi", manager_verse_result),
            ("4. Hastalık Analizi", disease_query_result),
            ("5. Büyü Analizi", magic_analysis_result),
            ("6. Hastalığa Yatkınlık Analizi", disease_prone_result)
        ]

        for title, result in sections:
            y = format_result_section(title, result, y)

        c.save()
        buffer.seek(0)
        return buffer

    except Exception as e:
        print(f"PDF oluşturmada hata: {str(e)}")
        raise

@router.post("/analyze", response_model=ComprehensiveResponse)
async def analyze_comprehensive(request: ComprehensiveRequest):
    try:
        print("Kapsamlı analiz başlatılıyor...")
        print(f"Gelen veriler: anne={request.mother_name}, çocuk={request.child_name}, hastalık={request.disease_name}")
        
        results = {}
        
        # Yönetici Esma Analizi
        try:
            results["manager_esma"] = AnalysisResult(
                success=True,
                data=await analyze_manager_esma({
                    "mother_name": request.mother_name,
                    "child_name": request.child_name
                })
            )
        except Exception as e:
            print(f"Yönetici Esma analizi başarısız: {str(e)}")
            results["manager_esma"] = AnalysisResult(success=False, error=str(e))
            
        # Kişisel Yönetici Analizi
        try:
            results["personal_manager"] = AnalysisResult(
                success=True,
                data=await analyze_personal_manager({
                    "child_name": request.child_name
                })
            )
        except Exception as e:
            print(f"Kişisel Yönetici analizi başarısız: {str(e)}")
            results["personal_manager"] = AnalysisResult(success=False, error=str(e))
            
        # Yönetici Ayet Analizi
        try:
            results["manager_verse"] = AnalysisResult(
                success=True,
                data=await analyze_manager_verse({
                    "mother_name": request.mother_name,
                    "child_name": request.child_name
                })
            )
        except Exception as e:
            print(f"Yönetici Ayet analizi başarısız: {str(e)}")
            results["manager_verse"] = AnalysisResult(success=False, error=str(e))
            
        # Hastalık Analizi
        try:
            results["disease"] = AnalysisResult(
                success=True,
                data=await analyze_disease({
                    "mother_name": request.mother_name,
                    "child_name": request.child_name,
                    "disease_name": request.disease_name
                })
            )
        except Exception as e:
            print(f"Hastalık analizi başarısız: {str(e)}")
            results["disease"] = AnalysisResult(success=False, error=str(e))
            
        # Büyü Analizi
        try:
            results["magic"] = AnalysisResult(
                success=True,
                data=await analyze_magic({
                    "mother_name": request.mother_name,
                    "child_name": request.child_name
                })
            )
        except Exception as e:
            print(f"Büyü analizi başarısız: {str(e)}")
            results["magic"] = AnalysisResult(success=False, error=str(e))
            
        # Hastalığa Yatkınlık Analizi
        try:
            results["disease_prone"] = AnalysisResult(
                success=True,
                data=await analyze_disease_prone({
                    "mother_name": request.mother_name,
                    "child_name": request.child_name
                })
            )
        except Exception as e:
            print(f"Hastalığa yatkınlık analizi başarısız: {str(e)}")
            results["disease_prone"] = AnalysisResult(success=False, error=str(e))

        # Maddi Blokaj/Bolluk Bereket Rızık Analizi
        try:
            results["financial_blessing"] = AnalysisResult(
                success=True,
                data=await analyze_financial_blessing_risk({
                    "mother_name": request.mother_name,
                    "child_name": request.child_name
                })
            )
        except Exception as e:
            print(f"Maddi Blokaj/Bolluk Bereket Rızık analizi başarısız: {str(e)}")
            results["financial_blessing"] = AnalysisResult(success=False, error=str(e))
        
        return ComprehensiveResponse(
            message="Analiz başarıyla tamamlandı.",
            mother_name=request.mother_name,
            child_name=request.child_name,
            disease_name=request.disease_name,
            manager_esma_analysis=results["manager_esma"],
            personal_manager_analysis=results["personal_manager"],
            manager_verse_analysis=results["manager_verse"],
            disease_analysis=results["disease"],
            magic_analysis=results["magic"],
            disease_prone_analysis=results["disease_prone"],
            financial_blessing_analysis=results["financial_blessing"]
        )
            
    except Exception as e:
        print(f"Genel hata: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analiz sırasında hata oluştu: {str(e)}"
        ) 

@router.post("/generate-pdf")
async def generate_pdf(request: PDFGenerationRequest):
    try:
        # PDF oluştur
        pdf_buffer = create_pdf_report(
            mother_name=request.mother_name,
            child_name=request.child_name,
            disease_name=request.disease_name,
            manager_esma_result=request.manager_esma_analysis.data if request.manager_esma_analysis.success else {"error": request.manager_esma_analysis.error},
            personal_manager_result=request.personal_manager_analysis.data if request.personal_manager_analysis.success else {"error": request.personal_manager_analysis.error},
            manager_verse_result=request.manager_verse_analysis.data if request.manager_verse_analysis.success else {"error": request.manager_verse_analysis.error},
            disease_query_result=request.disease_analysis.data if request.disease_analysis.success else {"error": request.disease_analysis.error},
            magic_analysis_result=request.magic_analysis.data if request.magic_analysis.success else {"error": request.magic_analysis.error},
            disease_prone_result=request.disease_prone_analysis.data if request.disease_prone_analysis.success else {"error": request.disease_prone_analysis.error}
        )

        # PDF'i response olarak gönder
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{request.mother_name}_{request.child_name}_analiz.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF oluşturulurken hata oluştu: {str(e)}"
        ) 