package sk.kopci.springintegration.fileprocessing.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import sk.kopci.springintegration.fileprocessing.persistance.ProcessedFile;
import sk.kopci.springintegration.fileprocessing.persistance.ProcessedFileDao;
import sk.kopci.springintegration.fileprocessing.persistance.dtos.ProcessedFilesResult;
import sk.kopci.springintegration.fileprocessing.services.dtos.Filter;
import sk.kopci.springintegration.fileprocessing.services.dtos.ProcessedFilesResponse;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProcessedFileService {

    @Autowired
    private ProcessedFileDao dao;

    private int defaultResultsPerPage = 50;

    public List<ProcessedFile> getAll() {
        return dao.findAll();
    }

    public ProcessedFilesResponse findByFilter(Filter filter) {
        ProcessedFilesResponse response = new ProcessedFilesResponse();

        int perPage = Optional.ofNullable(filter.getResultsPerPage())
                .filter(i -> i != 0)
                .orElse(defaultResultsPerPage);
        Pageable pageable = PageRequest.of(filter.getPage() - 1, perPage);

        // db call
        ProcessedFilesResult result = dao.findByCustomQuery(filter, pageable);

        response.setItems(result.getFiles());
        response.setCount(result.getCount());
        response.setPages((int) (result.getCount() / perPage) + 1);
        response.setPage(filter.getPage());

        return response;
    }

}
