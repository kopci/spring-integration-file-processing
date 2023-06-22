package sk.kopci.springintegration.fileprocessing.utils;

import org.xml.sax.SAXException;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class Formatters {

    public static Date getDateTime(String dateString) throws SAXException {
        SimpleDateFormat formatter = new SimpleDateFormat("dd.MM.yyyy hh:mm:ss.S");
        Date date;

        try {
            date = formatter.parse(dateString);
        } catch (ParseException e) {
            throw new SAXException(
                    String.format("Date string (%s) failed to parse", dateString)
            );
        }

        return date;
    }

}
