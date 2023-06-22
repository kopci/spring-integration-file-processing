package sk.kopci.springintegration.fileprocessing.business.pdf;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.handler.LoggingHandler;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import sk.kopci.springintegration.fileprocessing.utils.Messages;

import java.io.File;

@Slf4j
@Component
public class PdfProcessor {

    @Bean
    public IntegrationFlow processPdf() {
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

    /*

    @Transformer:
    The @Transformer annotation is used to convert or transform the payload of a message from one format to another.
    It is typically applied to a method that takes an input message and returns a transformed message or payload.
    This transformation can involve modifying the payload, converting its data type, or performing any custom logic
    to produce the desired output. @Transformer methods are usually responsible for data manipulation and enrichment.

    @ServiceActivator:
    The @ServiceActivator annotation is used to invoke a service or a component based on the incoming message.
    It triggers the execution of a method in response to a message, performing some business logic or processing.
    The method annotated with @ServiceActivator is responsible for handling the message,
    but it doesn't necessarily transform the message payload.
    @ServiceActivator methods are typically used to perform business operations, such as persisting data,
    invoking external services, or triggering downstream actions.

     */

    @ServiceActivator
    public File doSomeProcessing(@Payload File file) {
        log.info("Processing file: " + file.getName());
        return file;
    }

}

