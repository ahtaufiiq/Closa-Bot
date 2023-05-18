const {  SENDINBLUE_API_KEY } = require('./config');
var SibApiV3Sdk = require("sib-api-v3-sdk");
var defaultClient = SibApiV3Sdk.ApiClient.instance;
var apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = SENDINBLUE_API_KEY;

class Email {
    static createContact(email,name){
        let apiInstance = new SibApiV3Sdk.ContactsApi();
        let createContact = new SibApiV3Sdk.CreateContact();
        
        createContact.email = email;
        createContact.attributes = {"FIRSTNAME":name}
        createContact.listIds = [2]

        return apiInstance.createContact(createContact)
    }
    /**
     * 
     * @param {*} name 
     * @param {*} email 
     * @param {*} onboarding_date // Tuesday, May 10 · 19:30 – 21:00 WIB
     * @param {*} start_membership // March 20
     */

    static sendWelcomeToClosa(name,email,start_membership,onboarding_date='Tuesday, May 10 · 19:30 – 21:00 WIB'){
        var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email
        sendSmtpEmail = {
          sender: { name:"Apri",email: "apri@closa.me" },
          to: [
            {
              email,
              name
            }
          ],
          "templateId":6,
          "params":{
            onboarding_date,
            start_membership
         },
        };
        apiInstance.sendTransacEmail(sendSmtpEmail).then(
          function (data) {
            console.log("API called successfully. Returned data: " , data);
          },
          function (error) {
            console.error(error);
          }
        );
    }


    static sendPaymentReminder(users,day,ended_membership){
        var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 
        const reminder = day === '0 day' ? `today ${ended_membership}`:`within the next ${day} on  ${ended_membership}`
        sendSmtpEmail = {
          sender: { name:"Apri",email: "apri@closa.me" },
          to: users,
          "templateId":7,
          "params":{
            reminder
         },
        };
        apiInstance.sendTransacEmail(sendSmtpEmail).then(
          function (data) {
            console.log("API called successfully. Returned data: " , data);
          },
          function (error) {
            console.error(error);
          }
        );
    }


    static sendSuccessMembershipRenewal(name,email,ended_membership){
        var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email
        sendSmtpEmail = {
          sender: { name:"Apri",email: "apri@closa.me" },
          to: [
            {
              email,
              name
            }
          ],
          "templateId":5,
          "params":{
            name,
            ended_membership
         },
        };
        apiInstance.sendTransacEmail(sendSmtpEmail).then(
          function (data) {
            console.log("API called successfully. Returned data: " , data);
          },
          function (error) {
            console.error(error);
          }
        );
    }

    static sendEmailEarlyAccess(name,email,code){
        var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email
        sendSmtpEmail = {
          sender: { name:"Apri",email: "apri@closa.me" },
          to: [
            {
              email,
              name
            }
          ],
          "templateId":12,
          "params":{
            name,
            code
         },
        };
        apiInstance.sendTransacEmail(sendSmtpEmail).then(
          function (data) {
            console.log("API called successfully. Returned data: " , data);
          },
          function (error) {
            console.error(error);
          }
        );
    }
}

module.exports = Email