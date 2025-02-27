import pandas as pd
from utils.arabic_converter import LETTER_PROPERTIES

def analyze_esma(arabic_text: str):
    """Bir esmanın element dağılımını analiz et"""
    element_counts = {'ATEŞ': 0, 'HAVA': 0, 'TOPRAK': 0, 'SU': 0}
    elements_with_ebced = {'ATEŞ': [], 'HAVA': [], 'TOPRAK': [], 'SU': []}
    
    for char in arabic_text:
        # Harfin özelliklerini bul
        for props in LETTER_PROPERTIES.values():
            if props.arabic == char and props.is_nurani:  # Sadece nurani harfleri say
                element_counts[props.element] += 1
                elements_with_ebced[props.element].append(props.ebced)
                break
    
    # Baskın elementi bul
    max_count = max(element_counts.values())
    dominant_elements = [e for e, c in element_counts.items() if c == max_count]
    
    if len(dominant_elements) == 1:
        dominant_element = dominant_elements[0]
    else:
        # Eşitlik durumunda sıfıra en yakın ebced değerine sahip elementi seç
        min_distance = float('inf')
        dominant_element = None
        for element in dominant_elements:
            if elements_with_ebced[element]:
                min_ebced = min(abs(x) for x in elements_with_ebced[element])
                if min_ebced < min_distance:
                    min_distance = min_ebced
                    dominant_element = element
        
        if not dominant_element:
            dominant_element = dominant_elements[0]
    
    return {
        'element_counts': element_counts,
        'dominant_element': dominant_element,
        'elements_with_ebced': elements_with_ebced
    }

def main():
    try:
        # Excel dosyasını oku ve ilk satırı başlık olarak kullanma
        df = pd.read_excel('data/data.xlsx', sheet_name='Esma Ebced', header=None)
        
        print("Excel dosyası okundu.")
        print(f"Toplam satır sayısı: {len(df)}")
        
        # Başlık satırını bul ve atla
        header_row = df[df[2] == 'ESMA'].index[0]
        df = df.iloc[header_row + 1:].copy()
        
        # Boş olmayan satırları seç
        df = df.dropna(subset=[2])  # Esma adı olan satırları seç
        
        print(f"\nVeri temizleme sonrası satır sayısı: {len(df)}")
        
        # Sonuçları saklamak için liste
        results = []
        
        # Her esmayı analiz et
        for idx, row in df.iterrows():
            try:
                ebced = int(row[1])          # Ebced değeri
                esma_name = str(row[2])      # Esma adı
                arabic = str(row[3])         # Arapça yazılış
                meaning = str(row[4]) if pd.notna(row[4]) else ""  # Anlam
                
                print(f"\nAnaliz ediliyor: {esma_name} ({arabic}) - Ebced: {ebced}")
                
                analysis = analyze_esma(arabic)
                
                results.append({
                    'Esma': esma_name,
                    'Arabic': arabic,
                    'Ebced': ebced,
                    'Meaning': meaning,
                    'Dominant_Element': analysis['dominant_element'],
                    'ATES': analysis['element_counts']['ATEŞ'],
                    'HAVA': analysis['element_counts']['HAVA'],
                    'TOPRAK': analysis['element_counts']['TOPRAK'],
                    'SU': analysis['element_counts']['SU']
                })
                
            except Exception as e:
                print(f"Hata: Satır {idx} işlenirken hata oluştu: {str(e)}")
                continue
        
        if not results:
            print("Hiç sonuç bulunamadı!")
            return
        
        # Sonuçları DataFrame'e çevir
        results_df = pd.DataFrame(results)
        
        print("\nElement Dağılımları:")
        print("-" * 50)
        
        # Her element için esmaları listele
        for element in ['ATEŞ', 'HAVA', 'TOPRAK', 'SU']:
            element_esmas = results_df[results_df['Dominant_Element'] == element]
            print(f"\n{element} Elementi Baskın Olan Esmalar ({len(element_esmas)} adet):")
            
            if len(element_esmas) > 0:
                for _, row in element_esmas.iterrows():
                    print(f"{row['Esma']} ({row['Arabic']}) - Ebced: {row['Ebced']}")
                    print(f"Element Dağılımı: ATEŞ: {row['ATES']}, HAVA: {row['HAVA']}, "
                          f"TOPRAK: {row['TOPRAK']}, SU: {row['SU']}")
                    if row['Meaning']:
                        print(f"Anlamı: {row['Meaning']}")
                    print("-" * 30)
            else:
                print("Bu elementte esma bulunamadı.")
        
        # Excel'e kaydet
        try:
            results_df.to_excel('data/esma_analysis.xlsx', index=False)
            print("\nSonuçlar 'esma_analysis.xlsx' dosyasına kaydedildi.")
        except Exception as e:
            print(f"\nSonuçlar kaydedilirken hata oluştu: {str(e)}")
            
    except Exception as e:
        print(f"Ana işlem sırasında hata oluştu: {str(e)}")
        raise

if __name__ == "__main__":
    main() 