import win32com.client
import os

pptx_path = r'E:\我的桌面\入党积极分子思想汇报.pptx'
output_dir = r'E:\my project\slides_qa'

os.makedirs(output_dir, exist_ok=True)

powerpoint = win32com.client.Dispatch("PowerPoint.Application")
powerpoint.Visible = True

try:
    presentation = powerpoint.Presentations.Open(pptx_path, WithWindow=False)
    for i, slide in enumerate(presentation.Slides, 1):
        export_path = os.path.join(output_dir, f"slide-{i:02d}.jpg")
        slide.Export(export_path, "JPG", 1920, 1080)
        print(f"Exported slide {i}")
    presentation.Close()
    print("DONE - All slides exported")
finally:
    powerpoint.Quit()
