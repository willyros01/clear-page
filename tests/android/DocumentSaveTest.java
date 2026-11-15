package io.github.willyros01.clearpage;

import android.content.Context;
import android.content.Intent;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;
import androidx.test.uiautomator.BySelector;
import androidx.test.uiautomator.StaleObjectException;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.FixMethodOrder;
import org.junit.runners.MethodSorters;
import org.junit.runner.RunWith;
import java.io.File;
import java.nio.file.Files;
import java.util.regex.Pattern;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class DocumentSaveTest {
    private static final Pattern DOCUMENTS=Pattern.compile("com\\.(android|google\\.android)\\.documentsui");
    @Test public void saveUsesDocumentsUiAndCancellationKeepsText() throws Exception {
        Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        Intent launch=context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
        // The workflow launches verification and exercises a real process restart first.
        // Keep its final foreground editor/syntax fixture for native picker tests.
        File report=new File(context.getFilesDir(),"ate-ipad-syntax-verification.json");
        long end=System.currentTimeMillis()+180000;
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
        if(roots!=null){clickSelector(device,By.desc("Show roots"),"Show roots");device.waitForIdle();clickSelector(device,By.text("Downloads"),"Downloads");device.waitForIdle();}
        UiObject2 filename=device.wait(Until.findObject(By.clazz("android.widget.EditText")),10000);
        assertNotNull("Native filename field missing",filename);filename.setText("ate-storage-check.c");
        device.waitForIdle();
        if(device.hasObject(By.pkg(Pattern.compile(".*inputmethod.*")))){device.pressBack();device.waitForIdle();}
        BySelector nativeSave=By.res("android:id/button1").text(Pattern.compile("(?i)save"));
        for(int attempt=0;attempt<3&&device.hasObject(By.pkg(DOCUMENTS));attempt++){
            clickSelector(device,nativeSave,"Native Save");
            if(device.wait(Until.gone(nativeSave),3000))break;
        }
        assertTrue("Successful native document save notice missing",device.wait(Until.hasObject(By.textContains("Saved ate-storage-check.c")),15000));
        click(device,"Menu");click(device,"Open");
        assertTrue("Open must launch DocumentsUI",device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        UiObject2 saved=device.wait(Until.findObject(By.text("ate-storage-check.c")),10000);
        assertNotNull("Saved document missing from file manager",saved);saved.click();
        assertTrue("Native file open did not complete",device.wait(Until.hasObject(By.textContains("Opened ate-storage-check.c")),15000));
        click(device,"Save file");
        assertTrue(device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        filename=device.wait(Until.findObject(By.clazz("android.widget.EditText")),10000);
        assertNotNull("Extensionless filename field missing",filename);filename.setText("ate-no-extension");
        device.waitForIdle();
        if(device.hasObject(By.pkg(Pattern.compile(".*inputmethod.*")))){device.pressBack();device.waitForIdle();}
        clickSelector(device,nativeSave,"Extensionless Save");
        assertTrue("Extensionless save notice missing",device.wait(Until.hasObject(By.textContains("Saved ate-no-extension.")),15000));
        click(device,"Menu");click(device,"Open");
        assertTrue(device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        UiObject2 extensionless=device.wait(Until.findObject(By.text("ate-no-extension")),10000);
        assertNotNull("Provider appended or changed the extensionless filename",extensionless);extensionless.click();
        assertTrue(device.wait(Until.hasObject(By.textContains("Opened ate-no-extension")),15000));
        System.out.println("PASS: ACTION_CREATE_DOCUMENT picker, cancel preserves draft, filename/destination save and reopen succeed");
    }
    @Test public void toolbarAndProjectsAtLargeText() throws Exception {
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        try {
            device.executeShellCommand("settings put system font_scale 1.8");device.waitForIdle();
            click(device,"Menu");click(device,"Projects");
            assertTrue("Project tree heading missing",device.wait(Until.hasObject(By.text("Files and folders")),15000));
            click(device,"Open project");click(device,"Back to project");
            UiObject2 back=device.wait(Until.findObject(By.desc("Back to editor")),5000);
            if(back==null)back=device.wait(Until.findObject(By.text(Pattern.compile("Back( to editor)?"))),5000);
            assertNotNull("Project Back control missing after picker return",back);
            android.graphics.Rect bounds=back.getVisibleBounds();
            assertTrue("Project Back clipped",bounds.left>=0&&bounds.right<=device.getDisplayWidth()&&bounds.top>=0&&bounds.bottom<=device.getDisplayHeight());back.click();
            UiObject2 save=device.wait(Until.findObject(By.text("Save file")),10000);assertNotNull("Save hidden after Projects",save);
            bounds=save.getVisibleBounds();assertTrue("Save clipped at large text",bounds.left>=0&&bounds.right<=device.getDisplayWidth()&&bounds.bottom<=device.getDisplayHeight());
            System.out.println("PASS: largest Android text, Projects tree/picker return and Save visibility");
        } finally {device.executeShellCommand("settings put system font_scale 1.0");}
    }
    private void click(UiDevice device,String text){clickSelector(device,By.text(text),text);}
    private void clickSelector(UiDevice device,BySelector selector,String label){
        long end=System.currentTimeMillis()+15000;
        while(System.currentTimeMillis()<end){
            UiObject2 button=device.wait(Until.findObject(selector),1000);
            if(button==null)continue;
            try{button.click();device.waitForIdle();return;}catch(StaleObjectException changed){device.waitForIdle();}
        }
        fail(label+" missing or unstable");
    }
}
