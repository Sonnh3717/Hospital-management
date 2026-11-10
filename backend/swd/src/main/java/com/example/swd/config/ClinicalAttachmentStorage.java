package com.example.swd.config;

import com.example.swd.exception.WorkflowException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ClinicalAttachmentStorage {
    public static final long MAX_BYTES = 10L * 1024 * 1024;
    private final Path root;

    public record StoredAttachment(String key, String contentType) {
    }

    public record Download(Resource resource, String contentType, String filename, long size) {
    }

    public ClinicalAttachmentStorage(
            @Value("${app.clinical-attachments.root:target/clinical-attachments}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    public StoredAttachment store(MultipartFile file) {
        if (file == null || file.isEmpty())
            return null;
        if (!TransactionSynchronizationManager.isSynchronizationActive())
            throw new IllegalStateException("Attachment storage requires an active transaction");
        if (file.getSize() > MAX_BYTES)
            throw invalid("Tệp đính kèm không được vượt quá 10 MiB.");
        Path temporary = null;
        Path destination = null;
        try {
            Files.createDirectories(root);
            temporary = Files.createTempFile(root, ".upload-", ".tmp");
            byte[] header = new byte[8];
            long total = 0;
            int headerLength = 0;
            try (InputStream in = file.getInputStream(); OutputStream out = Files.newOutputStream(temporary)) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = in.read(buffer)) != -1) {
                    total += count;
                    if (total > MAX_BYTES)
                        throw invalid("Tệp đính kèm không được vượt quá 10 MiB.");
                    int copy = Math.min(count, header.length - headerLength);
                    if (copy > 0) {
                        System.arraycopy(buffer, 0, header, headerLength, copy);
                        headerLength += copy;
                    }
                    out.write(buffer, 0, count);
                }
            }
            String extension = detectExtension(header, headerLength);
            String key = UUID.randomUUID() + extension;
            destination = resolve(key);
            Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
            Path committedFile = destination;
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED)
                        removeQuietly(committedFile);
                }
            });
            return new StoredAttachment(key, contentType(extension));
        } catch (WorkflowException ex) {
            removeQuietly(temporary);
            removeQuietly(destination);
            throw ex;
        } catch (IOException ex) {
            removeQuietly(temporary);
            removeQuietly(destination);
            throw new WorkflowException(HttpStatus.INTERNAL_SERVER_ERROR, "ATTACHMENT_STORAGE_FAILED",
                    "Không thể lưu tệp báo cáo. Nội dung nhập vẫn được giữ để thử lại.");
        }
    }

    public Download download(String key) {
        Path file = resolve(key);
        if (!Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS))
            throw new WorkflowException(HttpStatus.NOT_FOUND, "ATTACHMENT_NOT_FOUND", "Không tìm thấy tệp báo cáo.");
        try {
            String extension = key.substring(key.lastIndexOf('.'));
            return new Download(new FileSystemResource(file), contentType(extension), "clinical-result" + extension,
                    Files.size(file));
        } catch (IOException ex) {
            throw new WorkflowException(HttpStatus.INTERNAL_SERVER_ERROR, "ATTACHMENT_READ_FAILED",
                    "Không thể đọc tệp báo cáo.");
        }
    }

    public boolean matches(String key, MultipartFile upload) {
        if (key == null || upload == null || upload.getSize() > MAX_BYTES)
            return false;
        var saved = download(key);
        if (saved.size() != upload.getSize())
            return false;
        try (InputStream old = saved.resource().getInputStream(); InputStream incoming = upload.getInputStream()) {
            long compared = 0;
            while (true) {
                byte[] a = old.readNBytes(8192), b = incoming.readNBytes(8192);
                compared += b.length;
                if (compared > MAX_BYTES || !java.util.Arrays.equals(a, b))
                    return false;
                if (a.length == 0)
                    return true;
            }
        } catch (IOException ex) {
            throw new WorkflowException(HttpStatus.INTERNAL_SERVER_ERROR, "ATTACHMENT_READ_FAILED",
                    "Không thể đối chiếu tệp báo cáo đã chốt.");
        }
    }

    private Path resolve(String key) {
        if (key == null || !key.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|png|jpg)"))
            throw new WorkflowException(HttpStatus.NOT_FOUND, "ATTACHMENT_NOT_FOUND", "Không tìm thấy tệp báo cáo.");
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root))
            throw invalid("Đường dẫn tệp không hợp lệ.");
        return resolved;
    }

    static String detectExtension(byte[] header, int length) {
        if (length >= 5 && header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F'
                && header[4] == '-')
            return ".pdf";
        if (length >= 8 && (header[0] & 255) == 137 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G'
                && header[4] == 13 && header[5] == 10 && header[6] == 26 && header[7] == 10)
            return ".png";
        if (length >= 3 && (header[0] & 255) == 255 && (header[1] & 255) == 216 && (header[2] & 255) == 255)
            return ".jpg";
        throw invalid("Chỉ nhận tệp PDF, PNG hoặc JPEG có nội dung hợp lệ.");
    }

    private static String contentType(String extension) {
        return switch (extension) {
            case ".pdf" -> "application/pdf";
            case ".png" -> "image/png";
            default -> "image/jpeg";
        };
    }

    private static WorkflowException invalid(String message) {
        return new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_ATTACHMENT", message,
                java.util.Map.of("attachment", message), java.util.List.of());
    }

    private static void removeQuietly(Path path) {
        if (path != null)
            try {
                Files.deleteIfExists(path);
            } catch (IOException ignored) {
                // Leave an orphan for maintenance if an OS lock prevents cleanup; never hide
                // the transaction error.
            }
    }
}
