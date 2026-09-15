package com.portfolio.portal.health;

import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class HealthControllerTest {
    private final DataSource source = mock(DataSource.class);
    private final HealthController controller = new HealthController(source);

    @Test
    void healthyDatabaseReturnsUpAndClosesConnection() throws Exception {
        Connection connection = mock(Connection.class);
        when(source.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(true);
        var response = controller.health();
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("status", "UP")
                .containsEntry("service", "portfolio-portal-api").containsKey("timestamp");
        verify(connection).close();
    }

    @Test
    void connectionFailureReturns503WithoutExceptionDetails() throws Exception {
        when(source.getConnection()).thenThrow(new SQLException("private connection details"));
        var response = controller.health();
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody()).containsEntry("status", "DOWN");
        assertThat(response.getBody().toString()).doesNotContain("private connection details");
    }

    @Test
    void invalidConnectionReturns503AndClosesConnection() throws Exception {
        Connection connection = mock(Connection.class);
        when(source.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(false);
        assertThat(controller.health().getStatusCode().value()).isEqualTo(503);
        verify(connection).close();
    }

    @Test
    void summaryContainsServiceInfo() {
        assertThat(controller.summary()).containsEntry("service", "portfolio-portal-api")
                .containsKeys("version", "endpoints");
    }
}
