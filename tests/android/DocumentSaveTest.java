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
        // Instrumentation may replace that process, so explicitly reopen recovered work.
        context.startActivity(launch);
        File report=new File(context.getFilesDir(),"ate-ipad-syntax-verification.json");
        long end=System.currentTimeMillis()+180000;
        while(!report.exists()&&System.currentTimeMillis()<end)Thread.sleep(250);
        assertTrue("Native Android editor report missing",report.exists());
        JSONObject result=new JSONObject(new String(Files.readAllBytes(report.toPath()),java.nio.charset.StandardCharsets.UTF_8));
        assertTrue(result.optString("error"),result.getBoolean("passed"));
        System.out.println("PASS: "+result.getJSONArray("checks").length()+" Android webview checks");
        UiObject2 back=device.findObject(By.text("Back to editor"));
        if(back!=null)back.click();
        openSavePicker(device,context);
        assertTrue("Save must launch DocumentsUI, not a share chooser",device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
        device.pressBack();
        assertTrue("Editor must resume after cancelling Save",device.wait(Until.hasObject(By.pkg(context.getPackageName())),10000));
        assertTrue("Cancellation notice missing",device.wait(Until.hasObject(By.textContains("Your draft is kept")),10000));
        openSavePicker(device,context);
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
        // Android's Files screen sometimes opens on another place (Recent): look in Downloads, where it was saved.
        if(saved==null&&device.hasObject(By.desc("Show roots"))){clickSelector(device,By.desc("Show roots"),"Show roots");device.waitForIdle();clickSelector(device,By.text("Downloads"),"Downloads");device.waitForIdle();saved=device.wait(Until.findObject(By.text("ate-storage-check.c")),10000);}
        assertNotNull("Saved document missing from file manager",saved);saved.click();
        if(!device.wait(Until.hasObject(By.textContains("Opened ate-storage-check.c")),15000))fail("Native file open did not complete. On screen: "+screenTexts(device)+" | ATE saw: "+keyboardReadings(device));
        openSavePicker(device,context);
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
    // Fire HD 8 sized screen (800 x 1280 pixels, about 600 x 960 in the page): with the on-screen keyboard up,
    // the page is wider than it is tall. The bottom line (word count) must still step aside while typing.
    @Test public void tabletSizedKeyboardHidesBottomLine() throws Exception {
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
        try {
            device.executeShellCommand("wm size 800x1280");device.executeShellCommand("wm density 213");
            device.executeShellCommand("settings put secure show_ime_with_hard_keyboard 1");device.waitForIdle();
            Intent launch=context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);context.startActivity(launch);
            assertTrue("ATE did not open on the Fire-sized screen",device.wait(Until.hasObject(By.pkg(context.getPackageName())),15000));
            BySelector counts=By.text(Pattern.compile(".*\\d+ words? · .*characters?.*"));
            assertTrue("Bottom line (word count) not shown before typing",device.wait(Until.hasObject(counts),15000));
            boolean shown=false;
            for(int attempt=0;attempt<3&&!shown;attempt++){
                device.click(device.getDisplayWidth()/2,device.getDisplayHeight()*45/100);device.waitForIdle();
                for(int i=0;i<20&&!shown;i++){shown=device.executeShellCommand("dumpsys input_method").contains("mInputShown=true");if(!shown)Thread.sleep(250);}
            }
            assertTrue("On-screen keyboard did not open when tapping the editor",shown);
            if(!device.wait(Until.gone(counts),10000)){
                String seen=device.executeShellCommand("logcat -d -s Capacitor/Console:I");StringBuilder lines=new StringBuilder();
                for(String l:seen.split("\n"))if(l.contains("ATE_KEYBOARD"))lines.append(l.substring(Math.max(0,l.indexOf("ATE_KEYBOARD")))).append(" | ");
                fail("Fire-sized screen: the bottom line stayed up while the keyboard was up. What ATE saw: "+(lines.length()==0?"no keyboard readings at all":lines.substring(Math.max(0,lines.length()-600))));
            }
            device.pressBack();device.waitForIdle();
            assertTrue("Bottom line did not come back after the keyboard closed",device.wait(Until.hasObject(counts),10000));
        } finally {
            device.executeShellCommand("wm size reset");device.executeShellCommand("wm density reset");device.waitForIdle();
        }
    }
    @Test public void toolbarAndProjectsAtLargeText() throws Exception {
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
        try {
            device.executeShellCommand("settings put system font_scale 1.8");device.waitForIdle();
            Intent launch=context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);context.startActivity(launch);
            assertTrue("ATE did not resume after changing system text size",device.wait(Until.hasObject(By.pkg(context.getPackageName())),15000));
            click(device,"Menu");click(device,"Projects");
            assertTrue("Project tree heading missing",device.wait(Until.hasObject(By.text("Files and folders")),15000));
            click(device,"Open project");click(device,"Back to project");
            assertTrue("Project picker did not return to the project tree",device.wait(Until.hasObject(By.text("Files and folders")),15000));
            click(device,"Add file");clickSelector(device,By.text(Pattern.compile("Choose files.*")),"Choose project files");
            if(!device.wait(Until.hasObject(By.pkg(DOCUMENTS)),5000)){
                UiObject2 files=device.findObject(By.text("Files"));if(files!=null)files.click();
            }
            assertTrue("Project Add file must open the native file picker",device.wait(Until.hasObject(By.pkg(DOCUMENTS)),15000));
            device.pressBack();device.waitForIdle();
            UiObject2 back=device.wait(Until.findObject(By.desc("Back to editor")),5000);
            if(back==null)back=device.wait(Until.findObject(By.text(Pattern.compile("Back( to editor)?"))),5000);
            assertNotNull("Project Back control missing after picker return",back);
            android.graphics.Rect bounds=back.getVisibleBounds();
            assertTrue("Project Back clipped",bounds.left>=0&&bounds.right<=device.getDisplayWidth()&&bounds.top>=0&&bounds.bottom<=device.getDisplayHeight());back.click();
            UiObject2 save=device.wait(Until.findObject(By.text("Save file")),5000);if(save==null)save=device.wait(Until.findObject(By.desc("Save file")),5000);assertNotNull("Save hidden after Projects",save);
            bounds=save.getVisibleBounds();assertTrue("Save clipped at large text",bounds.left>=0&&bounds.right<=device.getDisplayWidth()&&bounds.bottom<=device.getDisplayHeight());
            System.out.println("PASS: largest Android text, Projects tree, real Add files cancellation and picker return, Save visibility");
        } catch(AssertionError failure) {
            try{device.takeScreenshot(new File(context.getFilesDir(),"ate-large-failure.png"));device.dumpWindowHierarchy(new File(context.getFilesDir(),"ate-large-failure.xml"));}catch(Exception capture){System.out.println("Large-text evidence capture: "+capture);}
            throw failure;
        } finally {device.executeShellCommand("settings put system font_scale 1.0");}
    }
    // Right after a relaunch the editor page may still be loading when Save is
    // first visible. Only tap again if ATE is still in front and no picker opened.
    private void openSavePicker(UiDevice device,Context context){
        for(int attempt=0;attempt<4;attempt++){
            device.wait(Until.hasObject(By.pkg(context.getPackageName())),10000);
            click(device,"Save file");
            if(device.wait(Until.hasObject(By.pkg(DOCUMENTS)),5000))return;
            if(!device.hasObject(By.pkg(context.getPackageName())))return;
            device.waitForIdle();
        }
    }
    // Words on screen and ATE's keyboard readings, so a failure explains itself on the test run's page.
    private String screenTexts(UiDevice device){
        StringBuilder out=new StringBuilder();
        try{for(UiObject2 o:device.findObjects(By.text(Pattern.compile(".+")))){String t=o.getText();if(t!=null&&out.length()<700)out.append(t).append(" / ");}}catch(Exception ignored){}
        return out.length()==0?"(nothing readable)":out.toString();
    }
    private String keyboardReadings(UiDevice device){
        try{String seen=device.executeShellCommand("logcat -d -s Capacitor/Console:I");StringBuilder lines=new StringBuilder();
            for(String l:seen.split("\n"))if(l.contains("ATE_KEYBOARD"))lines.append(l.substring(l.indexOf("ATE_KEYBOARD"))).append(" | ");
            return lines.length()==0?"no keyboard readings":lines.substring(Math.max(0,lines.length()-500));}catch(Exception e){return "readings unavailable";}
    }
    private void click(UiDevice device,String text){
        long end=System.currentTimeMillis()+15000;
        while(System.currentTimeMillis()<end){
            UiObject2 button=device.wait(Until.findObject(By.text(text)),500);
            if(button==null)button=device.wait(Until.findObject(By.desc(text)),500);
            if(button==null)continue;
            try{if(!button.isEnabled()){android.os.SystemClock.sleep(100);continue;}button.click();device.waitForIdle();return;}catch(StaleObjectException changed){device.waitForIdle();}
        }
        fail(text+" missing or unstable");
    }
    private void clickSelector(UiDevice device,BySelector selector,String label){
        long end=System.currentTimeMillis()+15000;
        while(System.currentTimeMillis()<end){
            UiObject2 button=device.wait(Until.findObject(selector),1000);
            if(button==null)continue;
            try{if(!button.isEnabled()){android.os.SystemClock.sleep(100);continue;}button.click();device.waitForIdle();return;}catch(StaleObjectException changed){device.waitForIdle();}
        }
        fail(label+" missing or unstable");
    }
}
