package sk.kopci.springintegration.fileprocessing.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebConsoleController {

    @GetMapping("/files")
    public String getWebConsole() {
        return "web-console-spa";
    }

}
