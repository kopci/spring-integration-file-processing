package sk.kopci.springintegration.fileprocessing.business.metadatapdf;

import lombok.extern.slf4j.Slf4j;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;
import sk.kopci.springintegration.fileprocessing.utils.Formatters;

import static sk.kopci.springintegration.fileprocessing.utils.Constants.*;

@Slf4j
public class CustomXmlParser extends DefaultHandler {

    private MetadataPdfDto dto;
    private String processing = "";
    private String value = "";

    @Override
    public void startDocument() {
        dto = new MetadataPdfDto();
    }

    @Override
    public void startElement(String uri, String lName, String qName, Attributes attr) {
        processing = attr.getValue("name");
    }

    @Override
    public void characters(char[] ch, int start, int length) {
        value = new String(ch, start, length);
    }

    @Override
    public void endElement(String uri, String localName, String qName) throws SAXException {
        if (processing == null || processing.isEmpty())
            return;

        if (value.isBlank())
            value = "";

        switch (processing) {
            case PROPERTY_STRING1 -> dto.setString1(value);
            case PROPERTY_STRING2 -> dto.setString2(value);
            case PROPERTY_DATE1 -> dto.setDate1(Formatters.getDateTime(value));
        }

        processing= "";
    }

    public MetadataPdfDto getDto() {
        log.info(String.format(
                "Parsed data: %s: %s, %s: %s, %s: %s",
                PROPERTY_STRING1, dto.getString1(),
                PROPERTY_STRING2, dto.getString2(),
                PROPERTY_DATE1, dto.getDate1()
        ));

        return dto;
    }
}
