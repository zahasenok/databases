from lxml import etree


class MebliumPipeline:

    def open_spider(self, spider):
        self.root = etree.Element('data')

    def close_spider(self, spider):
        with open('../outputs/meblium.xml', 'wb') as fileobj:
            etree.ElementTree(self.root)\
                .write(fileobj, pretty_print=True, encoding='UTF-8')

    def process_item(self, item, spider):
        attributes = [
            'price',
            'description',
            'image',
            'title',
        ]
        item_obj = etree.SubElement(self.root, 'item')
        for attribute in attributes:
            etree.SubElement(item_obj, attribute).text = item[attribute]
        return item


class XsportPipeline:

    def open_spider(self, spider):
        self.root = etree.Element('data')

    def close_spider(self, spider):
        with open('../outputs/xsport.xml', 'wb') as fileobj:
            etree.ElementTree(self.root)\
                .write(fileobj, pretty_print=True, encoding='UTF-8')

    def process_item(self, item, spider):
        page = etree.SubElement(self.root, 'page', url=item['url'])
        for text in item['text']:
            etree.SubElement(page, 'fragment', type='text').text = text
        for url in item['images']:
            etree.SubElement(page, 'fragment', type='image').text = url
        return item
