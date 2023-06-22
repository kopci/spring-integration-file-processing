package sk.kopci.springintegration.fileprocessing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaRepositories(basePackages = "sk.kopci.springintegration.fileprocessing.persistance")
@EntityScan(basePackages = "sk.kopci.springintegration.fileprocessing.persistance")
@SpringBootApplication
public class FileProcessingApplication {

	public static void main(String[] args) {
		SpringApplication.run(FileProcessingApplication.class, args);
	}

}
