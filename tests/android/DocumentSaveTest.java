package io.github.willyros01.clearpage;

import android.content.Context;
import android.content.Intent;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.nio.file.Files;
import java.util.regex.Pattern;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class DocumentSaveTest {
    private static final Pattern DOCUMENTS=Pattern.compile("com\\.(android|google\\.android)\\.documentsui");
    @Test public void saveUsesDocumentsUiAndCancellationKeepsText() throws Exception {
        Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        Intent launch=context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
        context.startActivity(launch);
        File report=new File(context.getFilesDir(),"ate-ipad-syntax-verification.json");
        long end=System.currentTimeMillis()+120000;
        while(!report.exists()&&System.currentTimeMillis()<end)Thread.sleep(250);
        assertTrue("Native Android editor report missing",report.exists());
        JSONObject result=new JSONObject(new String(Files.readAllBytes(report.toPath()),java.nio.charset.StandardCharsets.UTF_8));
        assertTrue(result.optString("error"),result.getBoolean("passed"));
        System.out.println("PASS: "+result.getJSONArray("checks").length()+" Android webview checks");
        UiObject2 back=device.wait(Until.findObject(By.text("Back to editor")),15000);
        assertNotNull("Syntax dialog close button missing",back);back.click();
        click(device,"Save file");
        assertTrue("Save must launch DocumentsUI, not a share chooser",device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        device.pressBack();
        assertTrue("Editor must resume after cancelling Save",device.wait(Until.hasObject(By.pkg(context.getPackageName())),10000));
        assertTrue("Cancellation notice missing",device.wait(Until.hasObject(By.textContains("Your draft is kept")),10000));
        click(device,"Save file");
        assertTrue(device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        UiObject2 roots=device.findObject(By.desc("Show roots"));
        if(roots!=null){roots.click();UiObject2 downloads=device.wait(Until.findObject(By.text("Downloads")),5000);if(downloads!=null)downloads.click();}
        UiObject2 filename=device.wait(Until.findObject(By.clazz("android.widget.EditText")),10000);
        assertNotNull("Native filename field missing",filename);filename.setText("ate-storage-check.c");
        UiObject2 save=device.findObject(By.res(Pattern.compile("com\\.(android|google\\.android)\\.documentsui:id/action_menu_select")));
        if(save==null)save=device.findObject(By.text("SAVE"));
        if(save==null)save=device.findObject(By.text("Save"));
        assertNotNull("Native Save button missing",save);save.click();
        assertTrue("Successful native document save notice missing",device.wait(Until.hasObject(By.textContains("Saved ate-storage-check.c")),15000));
        click(device,"Menu");click(device,"Open");click(device,"Continue");
        assertTrue("Open must launch DocumentsUI",device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        UiObject2 saved=device.wait(Until.findObject(By.text("ate-storage-check.c")),10000);
        assertNotNull("Saved document missing from file manager",saved);saved.click();
        assertTrue("Native file open did not complete",device.wait(Until.hasObject(By.textContains("Opened ate-storage-check.c")),15000));
        System.out.println("PASS: ACTION_CREATE_DOCUMENT picker, cancel preserves draft, filename/destination save and reopen succeed");
    }
    private void click(UiDevice device,String text){UiObject2 button=device.wait(Until.findObject(By.text(text)),15000);assertNotNull(text+" missing",button);button.click();}
}
