package sk.kopci.springintegration.fileprocessing.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import sk.kopci.springintegration.fileprocessing.persistance.ProcessedFile;
import sk.kopci.springintegration.fileprocessing.services.ProcessedFileService;
import sk.kopci.springintegration.fileprocessing.services.dtos.Filter;
import sk.kopci.springintegration.fileprocessing.services.dtos.ProcessedFilesResponse;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private ProcessedFileService fileService;

    /*
    In case the requests are sent from another client-side application (React-based etc.),
    use @CrossOrigin on all endpoints.
     */

    @PostMapping("/files")
    public ProcessedFilesResponse getFiles(@RequestBody Filter filter) {
        return fileService.findByFilter(filter);
    }

}


