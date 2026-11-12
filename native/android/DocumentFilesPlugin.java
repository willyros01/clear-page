package io.github.willyros01.clearpage;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.webkit.MimeTypeMap;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "DocumentFiles")
public class DocumentFilesPlugin extends Plugin {
    private final AtomicBoolean saving = new AtomicBoolean(false);
    private final AtomicBoolean opening = new AtomicBoolean(false);

    @PluginMethod
    public void openDocument(PluginCall call) {
        if(opening.getAndSet(true)){call.reject("A file picker is already open");return;}
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try{startActivityForResult(call,intent,"documentOpened");}
        catch(Exception error){opening.set(false);call.reject("The system file manager could not open. Your draft is kept.");}
    }

    @ActivityCallback
    private void documentOpened(PluginCall call,ActivityResult result){
        if(call==null){opening.set(false);return;}
        if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null||result.getData().getData()==null){opening.set(false);call.reject("Open cancelled. Your draft is kept.","CANCELLED");return;}
        Uri uri=result.getData().getData();
        if(!"content".equals(uri.getScheme())){opening.set(false);call.reject("Choose a document in the system file manager.");return;}
        new Thread(()->{
            try(InputStream input=getContext().getContentResolver().openInputStream(uri);ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
                if(input==null)throw new IllegalStateException("No document input");
                byte[] buffer=new byte[8192];int count;
                while((count=input.read(buffer))!=-1){if(bytes.size()+count>10*1024*1024)throw new IllegalArgumentException("Choose a text file smaller than 10 MB.");bytes.write(buffer,0,count);}
                String text=StandardCharsets.UTF_8.newDecoder().onMalformedInput(java.nio.charset.CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(bytes.toByteArray())).toString();
                if(text.indexOf('\0')>=0)throw new IllegalArgumentException("This does not look like a plain-text file.");
                String name="Untitled.txt";
                try(Cursor cursor=getContext().getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){if(cursor!=null&&cursor.moveToFirst())name=cursor.getString(0);}
                JSObject response=new JSObject();response.put("text",text);response.put("name",name);call.resolve(response);
            }catch(Exception error){call.reject(error instanceof IllegalArgumentException?error.getMessage():"Could not open this UTF-8 text file. Your draft is kept.");}
            finally{opening.set(false);}
        },"ATE-document-open").start();
    }

    @PluginMethod
    public void saveDocument(PluginCall call) {
        if (saving.getAndSet(true)) { call.reject("A save is already open"); return; }
        String name = call.getString("name", "Untitled.txt").replaceAll("[\\\\/\\p{Cntrl}:]", "_");
        if (name.trim().isEmpty()) name = "Untitled.txt";
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        String extension=name.contains(".")?name.substring(name.lastIndexOf('.')+1).toLowerCase(java.util.Locale.ROOT):"txt";
        String mime=MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        intent.setType(mime==null?"text/plain":mime);
        intent.putExtra(Intent.EXTRA_TITLE, name);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try { startActivityForResult(call, intent, "documentSaved"); }
        catch (Exception error) { saving.set(false); call.reject("The system file manager could not open. Your draft is kept."); }
    }

    @ActivityCallback
    private void documentSaved(PluginCall call, ActivityResult result) {
        if (call == null) { saving.set(false); return; }
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            saving.set(false); call.reject("Save cancelled. Your draft is kept.", "CANCELLED"); return;
        }
        Uri uri = result.getData().getData();
        if (!"content".equals(uri.getScheme())) { saving.set(false); call.reject("Choose a document in the system file manager."); return; }
        new Thread(() -> {
            try {
                String text = call.getString("text", "");
                try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new IllegalStateException("No document output");
                    output.write(text.getBytes(StandardCharsets.UTF_8));
                    output.flush();
                }
                String name = call.getString("name", "Untitled.txt");
                try (Cursor cursor = getContext().getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                    if (cursor != null && cursor.moveToFirst()) name = cursor.getString(0);
                } catch (Exception ignored) { /* The write succeeded; the provider's display name is optional. */ }
                JSObject response = new JSObject(); response.put("name", name);
                call.resolve(response);
            } catch (Exception error) { call.reject("Could not finish saving the document. Your draft is kept."); }
            finally { saving.set(false); }
        }, "ATE-document-save").start();
    }
}
