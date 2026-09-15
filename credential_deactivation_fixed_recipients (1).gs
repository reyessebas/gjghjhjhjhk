/**
 * Assist Point - Credential Deactivation Automation
 * Bound to: "Proyectos y Roles - Assist Point"
 *
 * Flow:
 * 1. User checks "Send Deactivation" in column G of sheet "Desvinculacion".
 * 2. Script copies the Google Docs template.
 * 3. Replaces placeholders with row data. Blank values become "N/A".
 * 4. Creates a PDF.
 * 5. Emails the PDF to a fixed distribution list defined in this script.
 * 6. Writes the PDF link in I, status in J, and sent timestamp in K.
 *
 * IMPORTANT:
 * Run setupDeactivationTrigger() ONCE from Apps Script to create the
 * installable onEdit trigger and authorize Drive/Mail access.
 */


const FIXED_DEACTIVATION_RECIPIENTS = [
  'jreyes@assistpoint.co',
  'ikhan@specialtycareclinics.com',
  'zahira@assistpoint.co',
  'santiago@assistpoint.co',
  'ccastellanos@specialtycareclinics.com',
  'alejandro@assistpointglobal.co'
].join(',');

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Deactivation')
    .addItem('Install / Reset Trigger', 'setupDeactivationTrigger')
    .addToUi();
}

function setupDeactivationTrigger() {
  const ss = SpreadsheetApp.getActive();

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'handleDeactivationEdit')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('handleDeactivationEdit')
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  SpreadsheetApp.getUi().alert(
    'Credential Deactivation trigger installed successfully.'
  );
}

function handleDeactivationEdit(e) {
  if (!e || !e.range) return;

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;

  try {
    const config = getDeactivationConfig_();
    const sheet = e.range.getSheet();

    // Only react to "Send Deactivation" checkbox (column G).
    if (sheet.getName() !== config.SHEET_NAME) return;
    if (e.range.getColumn() !== 7) return;
    if (e.range.getRow() < 2) return;
    if (String(e.value).toUpperCase() !== 'TRUE') return;

    const row = e.range.getRow();
    const values = sheet.getRange(row, 1, 1, 12).getDisplayValues()[0];

    const employeeName = clean_(values[0]);
    const institutionalEmail = clean_(values[1]);
    const dialpad = clean_(values[2]);
    const department = clean_(values[3]);
    const recipients = FIXED_DEACTIVATION_RECIPIENTS;
    const currentStatus = clean_(values[9]).toUpperCase();

    // Ignore section headers / office labels.
    if (!employeeName || isSectionHeader_(employeeName)) {
      sheet.getRange(row, 7).setValue(false);
      return;
    }

    // Prevent accidental duplicate sends.
    if (currentStatus === 'SENT') return;

    const timeZone = config.TIME_ZONE || 'America/Bogota';
    const blankValue = config.BLANK_VALUE || 'N/A';
    const effectiveDate = Utilities.formatDate(
      new Date(),
      timeZone,
      'MMMM d, yyyy'
    );

    const employeeForDoc = safe_(employeeName, blankValue);
    const emailForDoc = safe_(institutionalEmail, blankValue);
    const dialpadForDoc = safe_(dialpad, blankValue);
    const departmentForDoc = safe_(department, blankValue);

    const templateFile = DriveApp.getFileById(config.TEMPLATE_ID);
    const outputFolder = DriveApp.getFolderById(config.OUTPUT_FOLDER_ID);

    const fileStamp = Utilities.formatDate(
      new Date(),
      timeZone,
      'yyyy-MM-dd'
    );

    const baseName = sanitizeFileName_(
      'Credential Deactivation - ' + employeeForDoc + ' - ' + fileStamp
    );

    // Create editable Google Doc from template.
    const docFile = templateFile.makeCopy(baseName, outputFolder);
    const doc = DocumentApp.openById(docFile.getId());
    const body = doc.getBody();

    replacePlaceholder_(body, 'EFFECTIVE_DATE', effectiveDate);
    replacePlaceholder_(body, 'EMPLOYEE_NAME', employeeForDoc);
    replacePlaceholder_(body, 'INSTITUTIONAL_EMAIL', emailForDoc);
    replacePlaceholder_(body, 'DIALPAD', dialpadForDoc);
    replacePlaceholder_(body, 'DEPARTMENT', departmentForDoc);

    doc.saveAndClose();

    // Create PDF in the same output folder.
    const pdfBlob = docFile
      .getAs(MimeType.PDF)
      .setName(baseName + '.pdf');

    const pdfFile = outputFolder.createFile(pdfBlob);

    const subjectPrefix =
      config.EMAIL_SUBJECT_PREFIX ||
      'Credential & Access Deactivation Request';

    const subject = subjectPrefix + ' - ' + employeeForDoc;

    const htmlBody =
      '<p>Hello,</p>' +
      '<p>Please find attached the credential and access deactivation request for ' +
      '<strong>' + escapeHtml_(employeeForDoc) + '</strong>.</p>' +
      '<p><strong>Institutional Email:</strong> ' +
      escapeHtml_(emailForDoc) + '<br>' +
      '<strong>Dialpad:</strong> ' +
      escapeHtml_(dialpadForDoc) + '<br>' +
      '<strong>Department / Area:</strong> ' +
      escapeHtml_(departmentForDoc) + '</p>' +
      '<p>Please confirm once all required deactivation actions have been completed.</p>' +
      '<p>Regards,<br>Assist Point Human Resources</p>';

    MailApp.sendEmail({
      to: recipients,
      subject: subject,
      htmlBody: htmlBody,
      attachments: [pdfFile.getBlob()],
      name: 'Assist Point Human Resources'
    });

    // Update the spreadsheet.
    sheet.getRange(row, 9)
      .setValue(pdfFile.getUrl())
      .setNote('Editable Google Doc: ' + docFile.getUrl());

    sheet.getRange(row, 10)
      .setValue('SENT')
      .setNote('Email sent successfully to: ' + recipients);

    sheet.getRange(row, 11)
      .setValue(new Date())
      .setNumberFormat('yyyy-mm-dd hh:mm:ss');

  } catch (err) {
    const sheet = e.range.getSheet();
    const row = e.range.getRow();

    // Reset checkbox so the user can fix the issue and retry.
    sheet.getRange(row, 7).setValue(false);

    sheet.getRange(row, 10)
      .setValue('ERROR')
      .setNote(String(err && err.message ? err.message : err));

    console.error(err);
  } finally {
    lock.releaseLock();
  }
}

function getDeactivationConfig_() {
  const ss = SpreadsheetApp.getActive();
  const configSheet = ss.getSheetByName('Deactivation Config');

  if (!configSheet) {
    throw new Error('Missing hidden sheet: Deactivation Config');
  }

  const rows = configSheet
    .getRange(2, 1, Math.max(configSheet.getLastRow() - 1, 1), 2)
    .getDisplayValues();

  const config = {};

  rows.forEach(([key, value]) => {
    key = clean_(key);
    if (key) config[key] = clean_(value);
  });

  if (!config.TEMPLATE_ID) {
    throw new Error('TEMPLATE_ID is missing in Deactivation Config.');
  }

  if (!config.OUTPUT_FOLDER_ID) {
    throw new Error('OUTPUT_FOLDER_ID is missing in Deactivation Config.');
  }

  if (!config.SHEET_NAME) {
    config.SHEET_NAME = 'Desvinculacion';
  }

  return config;
}

function replacePlaceholder_(body, key, value) {
  const pattern = '\\{\\{' + key + '\\}\\}';
  body.replaceText(pattern, String(value));
}

function safe_(value, fallback) {
  const cleaned = clean_(value);
  return cleaned ? cleaned : fallback;
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function sanitizeFileName_(name) {
  return String(name).replace(/[\/\\?%*:|"<>]/g, '-').trim();
}

function isSectionHeader_(value) {
  const v = clean_(value);
  return [
    'Bogotá (Sede 123)',
    'Bogotá (Sede Colina)',
    'Bogotá (Sede Coworking 127)',
    'Montevideo, Uruguay',
    'Medellín, Colombia',
    'CURRENT / NEW DEACTIVATIONS'
  ].includes(v);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
