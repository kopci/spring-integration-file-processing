package sk.kopci.springintegration.fileprocessing.persistance;

import org.springframework.data.domain.Pageable;
import sk.kopci.springintegration.fileprocessing.persistance.dtos.ProcessedFilesResult;
import sk.kopci.springintegration.fileprocessing.services.dtos.Filter;

public interface ProcessedFileCustom {

    ProcessedFilesResult findByCustomQuery(Filter filter, Pageable pageable);

}
