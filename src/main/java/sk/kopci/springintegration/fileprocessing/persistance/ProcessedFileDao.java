package sk.kopci.springintegration.fileprocessing.persistance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedFileDao extends JpaRepository<ProcessedFile, Long> {
}
