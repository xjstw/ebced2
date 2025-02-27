from fastapi import FastAPI, Depends, HTTPException, status, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import pandas as pd
from database import SessionLocal, engine
from models.auth import Base, User
from routers import (
    auth,
    name_query,
    personal_disease,
    manager_esma,
    manager_verse,
    spiritual_issues,
    name_coaching,
    disease_element,
    personal_manager_esma,
    couple_compatibility,
    disease_organ,
    magic_analysis,
    disease_prone,
    comprehensive_analysis,
    financial_blessing,
)
import secrets
import os
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse
from jinja2 import Template

# Load environment variables
load_dotenv()

# Güvenlik ayarları
security = HTTPBasic()
DOCS_USERNAME = os.getenv("DOCS_USERNAME", "admin")
DOCS_PASSWORD = os.getenv("DOCS_PASSWORD", "ebced123")

def verify_docs_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    is_username_correct = secrets.compare_digest(credentials.username, DOCS_USERNAME)
    is_password_correct = secrets.compare_digest(credentials.password, DOCS_PASSWORD)
    
    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kullanıcı adı veya şifre",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials

# Veritabanını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ebced API",
    description="Ebced hesaplama ve analiz API'si",
    version="1.0.0",
    docs_url=None,  # Varsayılan /docs devre dışı bırak
    redoc_url=None, # Varsayılan /redoc devre dışı bırak
)

# Özel docs endpoint'leri
@app.get("/docs", include_in_schema=False)
async def get_documentation(credentials: HTTPBasicCredentials = Depends(verify_docs_credentials)):
    from fastapi.openapi.docs import get_swagger_ui_html
    return get_swagger_ui_html(openapi_url="/openapi.json", title="API Docs")

@app.get("/redoc", include_in_schema=False)
async def get_redoc(credentials: HTTPBasicCredentials = Depends(verify_docs_credentials)):
    from fastapi.openapi.docs import get_redoc_html
    return get_redoc_html(openapi_url="/openapi.json", title="API ReDoc")

@app.get("/openapi.json", include_in_schema=False)
async def get_openapi(credentials: HTTPBasicCredentials = Depends(verify_docs_credentials)):
    from fastapi.openapi.utils import get_openapi
    openapi_schema = get_openapi(
        title="Ebced API",
        version="1.0.0",
        description="Ebced hesaplama ve analiz API'si",
        routes=app.routes,
    )
    return openapi_schema

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ebced2.vercel.app",  # Production frontend URL
        "http://localhost:5173",     # Development frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerları ekle
app.include_router(auth.router)

# Yetkilendirme gerektiren endpoint'ler için dependency
async def require_auth(current_user: User = Depends(auth.get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return current_user

try:
    # Excel dosyasından verileri oku
    print("Excel dosyaları okunuyor...")
    
    # Excel dosyasını aç ve sayfa isimlerini kontrol et
    excel_file = pd.ExcelFile('data/data.xlsx')
    print(f"Excel sayfaları: {excel_file.sheet_names}")
    
    # İsimler sayfasını oku
    print("\nİsimler sayfası okunuyor...")
    names_df = pd.read_excel(excel_file, sheet_name='İsimler')
    print("Ham veri örneği:")
    print(names_df.head())
    print(f"\nSütunlar: {names_df.columns.tolist()}")
    print(f"Satır sayısı: {len(names_df)}")
    
    # İsimleri temizle
    names_df = names_df.dropna(how='all')  # Tamamen boş satırları sil
    names_df = names_df.iloc[1:]  # Header satırını atla
    # Sütun isimlerini düzelt
    names_df.columns = ['name', 'arabic', 'ebced', 'gender']
    print("\nTemizlenmiş veri örneği:")
    print(names_df.head())
    print(f"Temizleme sonrası isim sayısı: {len(names_df)}")
    
    # Esma sayfasını oku
    print("\nEsma sayfası okunuyor...")
    try:
        # Önce tüm sayfayı oku ve içeriğini göster
        esma_df = pd.read_excel(excel_file, sheet_name='Esma Ebced', header=None, skiprows=2)
        print("\nHam veri boyutu:", esma_df.shape)
        print("\nİlk 10 satır:")
        print(esma_df.head(10))
        
        # Boş satırları temizle
        esma_df = esma_df.dropna(how='all')  # Tamamen boş satırları sil
        print(f"\nBoş olmayan satır sayısı: {len(esma_df)}")
        
        # Sütun isimlerini ayarla
        esma_df.columns = ['no', 'ebced', 'esma', 'arabic', 'meaning']
        print("\nSütunlar:", esma_df.columns.tolist())
        
        # Ebced değerlerini sayıya çevir
        esma_df['ebced'] = pd.to_numeric(esma_df['ebced'], errors='coerce')
        print("\nEbced değerleri sayıya çevrildi")
        print("Örnek ebced değerleri:", esma_df['ebced'].head())
        
        # Eksik verileri temizle
        esma_df = esma_df.dropna(subset=['ebced', 'esma'])
        print("\nTemizlenmiş veri örneği:")
        print(esma_df[['esma', 'arabic', 'ebced', 'meaning']].head())
        print(f"Temizleme sonrası esma sayısı: {len(esma_df)}")
        
    except Exception as e:
        print(f"\nEsma verilerini okurken hata: {str(e)}")
        print("Hata detayları:")
        import traceback
        traceback.print_exc()
        esma_df = pd.DataFrame(columns=['no', 'esma', 'arabic', 'ebced', 'meaning'])
    
    # Kuran sayfasını oku
    print("\nKuran sayfası okunuyor...")
    quran_df = pd.read_excel(excel_file, sheet_name='Arapça Kuran')
    
    # Gerekli sütunları seç ve yeniden adlandır
    quran_df = quran_df.rename(columns={
        'SURE NO': 'surah_number',
        'AYET NO': 'verse_number',
        'SURE ADI': 'surah_name',
        'DiyanetHatti.1': 'arabic_text',
        'TurkceMeal': 'turkish_meaning'
    })
    
    print("\n=== KURAN VERİLERİ KONTROL ===")
    print("Mevcut sütunlar:", quran_df.columns.tolist())
    print("\nİlk 5 ayetin Türkçe mealleri:")
    for _, row in quran_df.head().iterrows():
        print(f"Sure {row['surah_number']}, Ayet {row['verse_number']}, Sure Adı: {row['surah_name']}")
        print(f"Türkçe Meal: {row['turkish_meaning']}")
        print(f"Arapça Metin: {row['arabic_text']}")
        print("-" * 50)
    print("\nToplam ayet sayısı:", len(quran_df))
    print("=== KONTROL SONU ===\n")
    
    # Kuran verilerini temizle
    quran_df = quran_df.dropna(how='all')  # Tamamen boş satırları sil
    print("\nTemizlenmiş veri örneği:")
    print(quran_df.head())
    print(f"Temizleme sonrası ayet sayısı: {len(quran_df)}")
    
    # Sayısal sütunları dönüştür
    quran_df['surah_number'] = pd.to_numeric(quran_df['surah_number'], errors='coerce')
    quran_df['verse_number'] = pd.to_numeric(quran_df['verse_number'], errors='coerce')
    
    # Ayet ebced değerleri hesaplanıyor...
    print("\nAyet ebced değerleri hesaplanıyor...")
    from utils.arabic_converter import LETTER_PROPERTIES

    def calculate_verse_ebced(arabic_text: str) -> int:
        total = 0
        for char in str(arabic_text):
            for props in LETTER_PROPERTIES.values():
                if props.arabic == char:
                    total += props.ebced
                    break
        return total

    quran_df['verse_ebced'] = quran_df['arabic_text'].apply(calculate_verse_ebced)
    print("Ebced değerleri hesaplandı.")
    
    # Sadece gerekli sütunları al
    quran_df = quran_df[['surah_number', 'verse_number', 'surah_name', 'arabic_text', 'turkish_meaning', 'verse_ebced']]
    
    print("\nKuran DataFrame örnek veri:")
    print(quran_df[['surah_number', 'verse_number', 'arabic_text']].head())
    print("\nArabic text sütunu null değer kontrolü:")
    print(quran_df['arabic_text'].isnull().sum(), "adet null değer var")
    print("\nİlk 5 ayetin Arapça metinleri:")
    for _, row in quran_df.head().iterrows():
        print(f"Sure {row['surah_number']}, Ayet {row['verse_number']}:")
        print(f"Arapça metin: {row['arabic_text']}")
        print(f"Metin tipi: {type(row['arabic_text'])}")
        print(f"Metin uzunluğu: {len(str(row['arabic_text']))}")
        print("-" * 50)
    
    print("\nSütun isimleri düzeltildi:")
    print(quran_df.columns.tolist())
    print("\nVeri örneği:")
    print(quran_df.head())
    
    print("\nVeri temizleme tamamlandı.")

    # Dataframe'leri başlat ve router'ları ekle
    print("Router'lar başlatılıyor...")
    routers_config = [
        (name_query, "İsim Sorgulama", False),
        (personal_disease, "Kişiye Özel Hastalık Sorgu", True),
        (manager_esma, "Anne-Çocuk Yönetici Esma", False),
        (manager_verse, "Yönetici Ayet", True),
        (spiritual_issues, "Manevi Sıkıntılara Yatkınlık", False),
        (name_coaching, "İsim Koçluğu", False),
        (disease_element, "Hastalık Element", False),
        (personal_manager_esma, "Kişisel Yönetici Esma", False),
        (couple_compatibility, "Çift Uyumu", False),
        (disease_organ, "Hastalığa Yatkın Organ", False),
        (magic_analysis, "Büyü Analizi", False),
        (disease_prone, "Hastalığa Yatkınlık", False),
        (comprehensive_analysis, "Geniş Analiz", False),
        (financial_blessing, "Maddi Blokaj/Bolluk Bereket Rızık", True),
    ]

    for router_module, name, needs_quran in routers_config:
        try:
            # Initialize dataframes
            if needs_quran:
                router_module.init_dataframes(names_df, esma_df, quran_df)
            else:
                router_module.init_dataframes(names_df, esma_df)
            print(f"✓ {name} router'ı başarıyla başlatıldı.")
            
            # Add router with authentication
            app.include_router(
                router_module.router,
                dependencies=[Depends(require_auth)]
            )
        except Exception as e:
            print(f"✗ {name} router'ı başlatılırken hata: {str(e)}")

    print("Router'lar başlatıldı ve eklendi.")

except Exception as e:
    print(f"Kritik hata: {str(e)}")
    raise

@app.get("/")
def root():
    return {"message": "Ebced Hesaplama API'sine Hoş Geldiniz"}

# Rapor şablonunu yükle
with open('sonucpdf.html', 'r', encoding='utf-8') as f:
    report_template = Template(f.read())

@app.post("/api/generate-report", response_class=HTMLResponse)
async def generate_report(request: Request):
    try:
        # JSON verisini al
        data = await request.json()
        
        # Şablonu render et
        html = report_template.render(**data)
        
        return HTMLResponse(content=html, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 