package org.example.ticketingsystem.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.DataSourceInitializer;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

@Slf4j
@Configuration
public class DatabaseConfig {

    @Bean
    public DataSourceInitializer dataSourceInitializer(DataSource dataSource) {
        log.info("Initializing database schema from schema.sql...");

        DataSourceInitializer initializer = new DataSourceInitializer();
        initializer.setDataSource(dataSource);

        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("schema.sql"));

        populator.setContinueOnError(true);
        populator.setIgnoreFailedDrops(true);

        initializer.setDatabasePopulator(populator);
        initializer.setEnabled(true);

        log.info("Database schema initializer configured");
        return initializer;
    }
}
