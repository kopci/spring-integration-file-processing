package sk.kopci.springintegration.fileprocessing.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.core.GenericSelector;
import org.springframework.integration.core.MessageSource;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.Pollers;
import org.springframework.integration.file.FileReadingMessageSource;
import org.springframework.integration.file.filters.LastModifiedFileListFilter;
import org.springframework.integration.handler.LoggingHandler;
import utils.Constants;
import utils.Messages;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
public class FileProcessingConfig {

    @Value("${app-config.poller-delay.milliseconds}")
    private int pollerDelay;

    @Value("${app-config.last-modified-limit.seconds}")
    private int fileLastModifiedLimit;

    @Bean
    public IntegrationFlow configurePdfProcessing(
            @Value("${app-config.files.source}") String sourcePath,
            @Value("${app-config.files.target}") String targetPath
    ) throws ConfigurationException {
        validatePaths(sourcePath, targetPath);
        createTargetDirectory(targetPath);

        return IntegrationFlow.from(
                        getDataSource(sourcePath),
                        conf -> conf.poller(Pollers.fixedDelay(pollerDelay))
                )
                .filter(new GenericSelector<File>() { // accepts only PDF
                    @Override
                    public boolean accept(File source) {
                        return source.getName().endsWith(".pdf");
                    }
                })
                .enrichHeaders(eh -> eh.header(Constants.HEADER_FILE_TYPE, "firstType"))
                .enrichHeaders(eh -> eh.header(Constants.HEADER_TARGET_PATH, targetPath))
                .enrichHeaders(eh -> eh.header(Constants.HEADER_SOURCE_PATH, sourcePath))
                .enrichHeaders(eh -> eh.headerExpression(Constants.HEADER_ORIGINAL_FN, "payload.getName"))
                .channel("processPdf.input")
                .get();
    }

    @Bean
    public IntegrationFlow processingError() {
        return f -> f
                .log(LoggingHandler.Level.ERROR, Messages.PROCESSING_ERROR, "payload")
                .handle((p, h) -> false);
    }

    private void createTargetDirectory(final String target) throws ConfigurationException {
        Path path = Paths.get(target);
        if (!Files.exists(path)) {
            try{
                Files.createDirectories(path);
            } catch (IOException e) {
                throw new ConfigurationException(Messages.ERR_CREATING_TARGET_DIR + e.getMessage());
            }
        }
    }

    private MessageSource<File> getDataSource(String sourcePath) {
        FileReadingMessageSource messageSource = new FileReadingMessageSource();
        messageSource.setDirectory(new File(sourcePath));
        messageSource.setFilter(new LastModifiedFileListFilter(fileLastModifiedLimit));

        return messageSource;
    }

    private void validatePaths(String sourcePath, String targetPath) throws ConfigurationException {
        if (sourcePath == null || sourcePath.length() == 0) {
            throw new ConfigurationException("Messages.ERROR_INVALID_SOURCE_PATH");
        }
        if (targetPath == null || targetPath.length() == 0) {
            throw new ConfigurationException("Messages.ERROR_INVALID_TARGET_PATH");
        }
    }

}
