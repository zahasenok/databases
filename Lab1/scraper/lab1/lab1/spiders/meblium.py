import scrapy


class MebliumSpider(scrapy.Spider):
    name = "meblium"
    start_urls = ['https://www.meblium.com.ua/myagkaya-mebel/divany']
    XPATHS = {
        'price': '//span[contains(@itemprop, "price")][1]/text()',
        'description': '//div[contains(@itemprop, "description")]',
        'image': '//div[@class="main-image"]//img/@src',
        'title': '//h1/text()',
        'product_link': '//a[contains(@class, "product-link")]/@href',
        '_desc_values': '//div[contains(@itemprop, "description")]/*/text()',
        '_desc_keys': '//div[contains(@itemprop, "description")]/*/strong/text()',
    }

    '//div[contains(@itemprop, "description")]'
    '//div[contains(@itemprop, "description")]/*/text()'

    custom_settings = {
        'CLOSESPIDER_PAGECOUNT': 0,
        'CLOSESPIDER_ITEMCOUNT': 20,
        'ITEM_PIPELINES': {
            'lab1.pipelines.MebliumPipeline': 1,
        }
    }
    allowed_domains = [
        'www.meblium.com.ua',
        'meblium.com.ua'
    ]

    def parse_product(self, response):
        price = response.xpath(self.XPATHS['price'])
        image = response.xpath(self.XPATHS['image'])
        title = response.xpath(self.XPATHS['title'])

        def compose_description():
            keys = response.xpath(self.XPATHS['_desc_keys'])
            values = response.xpath(self.XPATHS['_desc_values'])

            if keys:
                keys.pop(0)

            def resolve_lengths(keys, values):
                keys_len = len(keys)
                values_len = len(values)

                if keys_len == values_len:
                    return zip(keys, values)

                if keys_len > values_len:
                    for _ in range(keys_len - values_len):
                        values.append("")

                elif values_len > keys_len:
                    for _ in range(values_len - keys_len):
                        values.append("")
                return zip(keys, values)

            result = []
            for k, v in resolve_lengths(keys, values):
                result.append(
                    f'{k.get()}: {v.get()}'
                )
            return '\n'.join(result)

        yield {
            'price': price.get(),
            'description': compose_description(),
            'image': image.get(),
            'title': title.get(),
        }

    def parse(self, response):
        links = self.extract_product_links(response)
        for link in links:
            yield response.follow(link, callback=self.parse_product)

    def extract_product_links(self, response):
        result = []
        product_links = response.xpath(self.XPATHS['product_link'])
        for product_link in product_links:
            clear_product_link = product_link.extract().strip()
            if clear_product_link:
                result.append(
                    clear_product_link
                )
        return result
