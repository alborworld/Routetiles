#!/usr/bin/python
from lxml import html
import requests

page = requests.get('http://www.confinvest.it/dbase/quotazioni.php')
tree = html.fromstring(page.text)

#valore_unitario=tree.xpath("/html/body/table[4]/tbody/tr[2]/td[2]/table/tbody/tr[3]/td[1]/text()")
valore_unitario=tree.xpath("/table[4]/tbody/tr[2]/td[2]/table/tbody/tr[3]/td[1]/text()")

print 'Quotazione uniterio sterline Elisabetta II: ', valore_unitario
