const nodemailer = require('nodemailer');

// Email transporter configuration
const createEmailTransporter = () => {
  // For development, use ethereal email (test email service)
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.password'
      }
    });
  }

  // For production, use configured SMTP service
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  taskAssigned: {
    subject: 'New Task Assigned: {{taskTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Task Assigned</h2>
        <p>Hello {{userName}},</p>
        <p>You have been assigned a new task:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{taskTitle}}</h3>
          <p style="margin: 0 0 10px 0; color: #6b7280;">{{taskDescription}}</p>
          <div style="margin-top: 15px;">
            <span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 10px;">
              Priority: {{priority}}
            </span>
            {{#if dueDate}}
            <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
              Due: {{dueDate}}
            </span>
            {{/if}}
          </div>
        </div>
        <p>Project: <strong>{{projectName}}</strong></p>
        <div style="margin: 30px 0;">
          <a href="{{appUrl}}/projects/{{projectId}}/tasks/{{taskId}}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Task
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          You received this email because you are a member of the {{projectName}} project.
          <a href="{{appUrl}}/settings/notifications">Manage your notification preferences</a>
        </p>
      </div>
    `
  },

  taskUpdated: {
    subject: 'Task Updated: {{taskTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Task Updated</h2>
        <p>Hello {{userName}},</p>
        <p>A task assigned to you has been updated:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{taskTitle}}</h3>
          <p style="margin: 0 0 10px 0; color: #6b7280;">Updated by: {{updatedBy}}</p>
          {{#if changes}}
          <div style="margin-top: 15px;">
            <strong>Changes:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              {{#each changes}}
              <li style="margin: 5px 0;">{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}
        </div>
        <div style="margin: 30px 0;">
          <a href="{{appUrl}}/projects/{{projectId}}/tasks/{{taskId}}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Task
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          <a href="{{appUrl}}/settings/notifications">Manage your notification preferences</a>
        </p>
      </div>
    `
  },

  taskCompleted: {
    subject: 'Task Completed: {{taskTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Task Completed! 🎉</h2>
        <p>Hello {{userName}},</p>
        <p>Great news! A task has been marked as completed:</p>
        <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{taskTitle}}</h3>
          <p style="margin: 0 0 10px 0; color: #6b7280;">Completed by: {{completedBy}}</p>
        </div>
        <p>Project: <strong>{{projectName}}</strong></p>
        <div style="margin: 30px 0;">
          <a href="{{appUrl}}/projects/{{projectId}}" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Project
          </a>
        </div>
      </div>
    `
  },

  projectInvitation: {
    subject: 'Project Invitation: {{projectName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Project Invitation</h2>
        <p>Hello {{userName}},</p>
        <p>You have been invited to join a project:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{projectName}}</h3>
          <p style="margin: 0 0 10px 0; color: #6b7280;">{{projectDescription}}</p>
          <p style="margin: 0; color: #6b7280;">Invited by: {{invitedBy}}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="{{appUrl}}/projects/{{projectId}}" 
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            View Project
          </a>
          <a href="{{appUrl}}/projects/{{projectId}}/accept-invitation" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
      </div>
    `
  },

  mention: {
    subject: 'You were mentioned in: {{taskTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">You were mentioned</h2>
        <p>Hello {{userName}},</p>
        <p>{{mentionedBy}} mentioned you in a comment:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{taskTitle}}</h3>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-style: italic;">"{{commentText}}"</p>
          </div>
        </div>
        <div style="margin: 30px 0;">
          <a href="{{appUrl}}/projects/{{projectId}}/tasks/{{taskId}}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Comment
          </a>
        </div>
      </div>
    `
  }
};

// Render email template with data
const renderTemplate = (templateName, data) => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  let subject = template.subject;
  let html = template.html;

  // Simple template rendering (replace {{variable}} with data values)
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, data[key] || '');
    html = html.replace(regex, data[key] || '');
  });

  // Handle conditional blocks {{#if condition}}...{{/if}}
  html = html.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
    return data[condition] ? content : '';
  });

  // Handle each loops {{#each array}}...{{/each}}
  html = html.replace(/{{#each\s+(\w+)}}(.*?){{\/each}}/gs, (match, arrayName, content) => {
    const array = data[arrayName];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemContent = content;
      if (typeof item === 'object') {
        Object.keys(item).forEach(key => {
          itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), item[key] || '');
        });
      } else {
        itemContent = itemContent.replace(/{{this}}/g, item);
      }
      return itemContent;
    }).join('');
  });

  return { subject, html };
};

// Send email notification
const sendEmailNotification = async (to, templateName, data) => {
  try {
    const transporter = createEmailTransporter();
    const { subject, html } = renderTemplate(templateName, {
      ...data,
      appUrl: process.env.CLIENT_URL || 'http://localhost:3000'
    });

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Task Manager'}" <${process.env.FROM_EMAIL || 'noreply@taskmanager.com'}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmailNotification,
  emailTemplates,
  renderTemplate
};