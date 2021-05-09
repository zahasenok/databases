import xml.etree.ElementTree as ET

def display_links():
    mytree = ET.parse('outputs/xsport.xml')
    myroot = mytree.getroot()
    print("HyperLinks :")
    for page in myroot:
        print(page.attrib['url'])

display_links()

