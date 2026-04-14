import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    """
    Extracts text from a .docx file without external dependencies.
    """
    try:
        with zipfile.ZipFile(path) as z:
            # Word document content is in word/document.xml
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Extract all text elements
            texts = []
            for paragraph in tree.findall('.//w:p', ns):
                para_text = ""
                for t in paragraph.findall('.//w:t', ns):
                    if t.text:
                        para_text += t.text
                if para_text:
                    texts.append(para_text)
            
            return "\n".join(texts)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    file_path = r"D:\lucas\Desktop\perfumUkStripe\briefing_perfumes_uk_v3.docx"
    output_path = r"D:\lucas\Desktop\perfumUkStripe\scratch\briefing_content.txt"
    if os.path.exists(file_path):
        text = get_docx_text(file_path)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Content written to {output_path}")
    else:
        print(f"File not found: {file_path}")
