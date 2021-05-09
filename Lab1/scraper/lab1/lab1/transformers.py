import lxml.etree as ET


def xslt_parse():
    dom = ET.parse('outputs/meblium.xml')
    xslt = ET.parse('outputs/meblium.xslt')

    transform = ET.XSLT(xslt)
    newdom = transform(dom)

    with open('outputs/meblium.html', 'wb') as fileobj:
        fileobj.write(ET.tostring(newdom, pretty_print=True))


if __name__ == '__main__':
    xslt_parse()
