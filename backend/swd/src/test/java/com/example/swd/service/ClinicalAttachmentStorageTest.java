package com.example.swd.service;

import com.example.swd.exception.WorkflowException;
import java.nio.file.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.junit.jupiter.api.Assertions.*;

class ClinicalAttachmentStorageTest {
    @TempDir Path directory;
    ClinicalAttachmentStorage storage;
    @BeforeEach void setup() {storage=new ClinicalAttachmentStorage(directory.toString());TransactionSynchronizationManager.initSynchronization();}
    @AfterEach void clear() {TransactionSynchronizationManager.clearSynchronization();}
    @Test void privateRandomKeyIgnoresUserFilenameAndReturnsCorrectDownloadType() throws Exception {
        var file=new MockMultipartFile("attachment","../../report.exe","application/x-msdownload","%PDF-1.7\nreport".getBytes());
        var stored=storage.store(file);assertTrue(stored.key().matches("[0-9a-f-]{36}\\.pdf"));
        var download=storage.download(stored.key());assertEquals("application/pdf",download.contentType());
        try(var stream=download.resource().getInputStream()){assertArrayEquals(file.getBytes(),stream.readAllBytes());}
        assertTrue(storage.matches(stored.key(),file));
        assertFalse(storage.matches(stored.key(),new MockMultipartFile("attachment","x.pdf","application/pdf","%PDF-1.7\nother!".getBytes())));
    }
    @Test void rollbackCompensationRemovesFileWhileCommitRetainsIt() {
        var file=new MockMultipartFile("attachment","x.pdf","application/pdf","%PDF-1.7".getBytes());
        var rolledBack=storage.store(file);
        TransactionSynchronizationManager.getSynchronizations().forEach(s->s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        assertFalse(Files.exists(directory.resolve(rolledBack.key())));
        TransactionSynchronizationManager.clearSynchronization();TransactionSynchronizationManager.initSynchronization();
        var committed=storage.store(file);
        TransactionSynchronizationManager.getSynchronizations().forEach(s->s.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
        assertTrue(Files.exists(directory.resolve(committed.key())));
    }
    @Test void filenameAndMimeCannotDisguiseNonReportFile() throws Exception {
        var file=new MockMultipartFile("attachment","report.pdf","application/pdf","<script>bad</script>".getBytes());
        assertEquals("INVALID_ATTACHMENT",assertThrows(WorkflowException.class,()->storage.store(file)).getCode());
        try(var paths=Files.list(directory)){assertEquals(0,paths.count());}
    }
    @Test void rejectsOversizeAndPathTraversal() {
        var file=new MockMultipartFile("attachment","x.pdf","application/pdf",new byte[(int)ClinicalAttachmentStorage.MAX_BYTES+1]);
        assertThrows(WorkflowException.class,()->storage.store(file));
        assertThrows(WorkflowException.class,()->storage.download("../secrets.pdf"));
        assertThrows(WorkflowException.class,()->storage.download(null));
    }
    @Test void pngAndJpegAcceptedBySignatureOnly() {
        assertEquals(".png",ClinicalAttachmentStorage.detectExtension(new byte[]{(byte)137,80,78,71,13,10,26,10},8));
        assertEquals(".jpg",ClinicalAttachmentStorage.detectExtension(new byte[]{(byte)255,(byte)216,(byte)255},3));
        assertThrows(WorkflowException.class,()->ClinicalAttachmentStorage.detectExtension(new byte[]{80,68,70},3));
    }
    @Test void writingAttachmentRequiresActiveTransactionSynchronization() {
        TransactionSynchronizationManager.clearSynchronization();
        assertThrows(IllegalStateException.class,()->storage.store(new MockMultipartFile("attachment","x.pdf","application/pdf","%PDF-1.7".getBytes())));
        TransactionSynchronizationManager.initSynchronization();
    }
}
