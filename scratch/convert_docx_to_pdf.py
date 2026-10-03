import os
import sys
import win32com.client

def convert_to_pdf(docx_path, pdf_path):
    print(f"Converting {docx_path} to {pdf_path} using MS Word COM...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(os.path.abspath(docx_path))
        # 17 = wdFormatPDF
        doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
        doc.Close()
        print("PDF conversion completed successfully!")
    except Exception as e:
        print(f"Error converting DOCX to PDF via MS Word COM: {e}")
        raise e
    finally:
        word.Quit()

if __name__ == "__main__":
    docx_file = r"D:\Assignments\student-api\CampusConnect_Lab6_Report.docx"
    pdf_file = r"D:\Assignments\student-api\CampusConnect_Lab6_Report.pdf"
    convert_to_pdf(docx_file, pdf_file)
