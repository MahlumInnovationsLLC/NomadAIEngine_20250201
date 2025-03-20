import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set - email services will not function");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailTemplateParams {
  documentName: string;
  documentLink: string;
  requesterName: string;
  approvalLink: string;
  rejectLink: string;
}

/**
 * Generic email sending function to handle any type of email
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  fromEmail?: string
): Promise<{success: boolean; result?: any; error?: any}> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("Cannot send email: SENDGRID_API_KEY is not set");
    return {
      success: false,
      error: "Email service configuration is missing"
    };
  }

  try {
    // Use provided fromEmail or fall back to environment variable
    const from = fromEmail || process.env.SENDGRID_FROM_EMAIL;
    
    if (!from) {
      console.error("Cannot send email: No sender email address provided");
      return {
        success: false,
        error: "Sender email configuration is missing"
      };
    }
    
    const msg = {
      to,
      from,
      subject,
      html: htmlContent,
    };

    console.log(`Sending email to ${to} with subject: ${subject}`);
    const result = await mailService.send(msg);
    console.log(`Email sent successfully to ${to}`);
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return {
      success: false,
      error
    };
  }
}

export async function sendApprovalRequestEmail(
  to: string,
  params: EmailTemplateParams
): Promise<boolean> {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
    const subject = `Document Approval Request: ${params.documentName}`;
    const htmlContent = `
      <h2>Document Approval Request</h2>
      <p>${params.requesterName} has requested your approval for document: ${params.documentName}</p>
      <p>You can review the document here: <a href="${params.documentLink}">View Document</a></p>
      <div style="margin: 20px 0;">
        <a href="${params.approvalLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">
          Approve
        </a>
        <a href="${params.rejectLink}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none;">
          Reject
        </a>
      </div>
      <p>Or you can review the document in the system and approve/reject from there.</p>
    `;

    const { success } = await sendEmail(to, subject, htmlContent, fromEmail);
    return success;
  } catch (error) {
    console.error('Send approval request email error:', error);
    return false;
  }
}
