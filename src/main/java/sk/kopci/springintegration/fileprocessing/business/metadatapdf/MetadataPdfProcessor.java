package sk.kopci.springintegration.fileprocessing.business.metadatapdf;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.Transformer;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.handler.LoggingHandler;
import org.springframework.messaging.handler.annotation.Payload;
import org.xml.sax.SAXException;
import sk.kopci.springintegration.fileprocessing.services.ProcessedFileService;
import sk.kopci.springintegration.fileprocessing.utils.Messages;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import java.io.File;
import java.io.IOException;

@Slf4j
@Configuration
public class MetadataPdfProcessor {

    @Autowired
    private ProcessedFileService service;

    @Bean
    public IntegrationFlow processMetadataPdf() {
        return f -> f
                .log(LoggingHandler.Level.INFO, Messages.PROCESSING_STARTED, "payload.getName")
                .enrich(e -> e
                        .errorChannel("processingError.input")
                        .requestPayloadExpression("payload")
                        .requestSubFlow(sf -> sf
                                .handle(this, "doSomeProcessing")
                                .transform(p -> true)
                        )
                        .headerExpression("processedCorrectly", "payload")
                )
                .channel("backupFile.input");
    }

    @Transformer
    public File doSomeProcessing(@Payload File file) throws ParserConfigurationException, IOException, SAXException {
        try {
            CustomXmlParser parser = new CustomXmlParser();

            // XML metadata file has to have same name as PDF file
            File xml = new File(file.getAbsolutePath().replace("pdf", "xml"));

            SAXParserFactory factory = SAXParserFactory.newInstance();
            SAXParser saxParser = factory.newSAXParser();
            saxParser.parse(xml, parser);

            MetadataPdfDto dto = parser.getDto();

            service.logProcessedFile(
                    dto.getString1(),
                    dto.getString2()
            );

            log.info("Processed correctly.");

        } catch (Exception e) {
            log.info("Something went wrong.");
            throw e;
        }
        return file;
    }

}
