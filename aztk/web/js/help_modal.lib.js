/*
static_js/help_modal.lib.js

Author: Clint
Date Added: Mon Feb 5 10:17:57 CST 2007

Zoto help modal

*/
function zoto_help_modal_item(options){
	this.$uber(options);
}
extend(zoto_help_modal_item, zoto_expand_modal_item, {
});

function zoto_help_modal_menu(options) {
	this.$uber(options);
}
extend(zoto_help_modal_menu, zoto_expand_modal_menu, {
});

/*********************************************************
*					ZOTO OVERVIEW
*********************************************************/
/*
 * zoto overview - zoto_overview_menu()
 */
function zoto_overview_menu(options) {
	this.$uber(options);
}
extend(zoto_overview_menu, zoto_help_modal_menu, {
	activate: function() {
	}
	
});

/*
* zoto about - zoto_about_item()
*/

function zoto_about_item(options) {
        options = merge({'title': _("about zoto")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_ABOUT";
}
extend(zoto_about_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var learn_more = A({'href': "javascript:currentDocument().help_modal.show_context('HELP_OVERVIEW_FEATURES')"}, _("accounts starting at $19.95 a year!"));
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Zoto is an online photo sharing company unlike any other.  While most photo sharing sites provide limited online sharing features, Zoto focuses on providing powerful 'application-like' features that give you the ability to store, organize, and share ALL your digital photos online - ensuring they are safe and secure, and available to you anywhere in the world."),
				BR(),BR(),BR(),
				H5(_("our mission")),
				BR(),
				_("When we sat down and designed the new Zoto, our mission was make a photo sharing service that was fast and easy-to-use for the average user to LOOK at their own photos online.  At the same time, we wanted to build in powerful features that gave professional users the flexibility they required for sharing their photos with others."),
				BR(),BR(),
				_("On a daily basis Zoto does what any good software development firm should do - listen to their users and continue to make better software.  We aren't necessarily smarter than anyone else, we just work harder at it!"),
				BR(),BR(),BR(),
				H5(_("the technology")),
				BR(),
				_("As opposed to other website technologies, Zoto's software tells your browser how to build the pages on our site right inside your browser.  Very few sites employ this technology across the board - Gmail is a good example of this for the email space, but Zoto is the only site that does it this way for managing your photos."),
				BR(),BR(),
				_("Zoto's one-time delivery of JavaScript contains all the information needed by your browser to build pages on our site.  By offloading the job of building the pages to your computer, and having your browser cache the JavaScript code, we are able to increase the speed of website response and page navigation."),
				BR(),BR(),BR(),
				H5({}, _("Learn more about our "), learn_more)
			)
		);
	}
});
/*
* zoto features - zoto_features_item()
*/

function zoto_features_item(options) {
        options = merge({'title': _("account features")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_FEATURES";
}
extend(zoto_features_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var heard_enough = A({'href': "/signup/"}, _("Sign up for a Zoto account now!"));
		var ceo_photos = A({'href': currentWindow().site_manager.make_url("kordless", "lightbox")}, _("CEO's lightbox of photos"));
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Accounts on Zoto are paid-only, and start at $19.95 for a single year's service.  If you want to see a little of the amazing stuff we can do with your photos, jump over to our "),ceo_photos,".",
				BR(),BR(),BR(),
				H5(_("account specials")),
				BR(),
				_("Zoto's new accounts provide unlimited storage for the meager price of $19.95 a year.  However, if you had an older 'free' account on Zoto, you may upgrade your account for a year for the low, low price of $9.95.  All older paid accounts (signed up before 3/1/07), will receive a free year's service as part of their upgrade to 3.0.  Please keep in mind that these offers are only available for a limited time, and you should take action now to ensure you receive the best deal."),
				BR(),BR(),BR(),
				H5(_("just $19.95 a year for unlimited storage!")),
				BR(),
				_("You can try Zoto risk free for 60 days!  Zoto accounts come with unlimited storage space, unlimited access to your images, and each account gets the following list of great features:"),
				UL({},
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("drag-n-dropable homepages")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("sortable, liquidized lightboxes")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("highly customizable albums")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("50% larger image detail photos")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("fastest photo tagging ever seen")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("powerful photo searching")),					
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("batch enabled uploader client")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("advanced permissions lists")),
					LI({'style': 'list-style: url(/image/help/check.png);'}, _("atom and RSS feeds"))
				),
				BR(),
				H5({}, _("Heard enough? "), heard_enough)
			)
		);
	}
});
/*
* zoto language - zoto_language_item()
*/

function zoto_language_item(options) {
        options = merge({'title': _("language support")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_LANGUAGE";
}
extend(zoto_language_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Zoto 3.0 fully supports UTF-8 encoded languages.  This means you can tag, title and comment photos in just about any language that is supported by your web browser."),
				BR(),BR(),
				_("Due to the large number of changes in the new site we were unable to use the old version to translate the site into Chinese.  While you can still tag and comment in Chinese, the text that you will see on the site (like this text) is limited to English only for the moment."),
				BR(),BR(),
				_("We expect to have Chinese, Japanese, Spanish, Portuguese, French and German support by the end of Summer, 2007.  Sorry for the delay!"),
				BR(),BR(),
				_("我们是傻的!")
			)
		);
	}
});
/*
* zoto terms of use - zoto_terms_item()
*/

function zoto_terms_item(options) {
        options = merge({'title': _("terms of use")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_TERMS";
}
extend(zoto_terms_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var contact_link = A({'href': "javascript:draw_contact_form()"}, _("contact form"));
		replaceChildNodes(this.content_el,
			DIV({'style': "height: 480px; overflow: auto; padding-right: 10px;"}, 
				H5(_("basic terms")),
				BR(),
				_("Before you signup for a Zoto account, you must read and agree to our Terms of Use, including any future amendments. All of this document, including our Privacy Policy, are collectively referred to as the 'Agreement'. The Zoto Uploader Software and Website, and any functionality provided by the two are collectively referred to as the 'Service'. By using our Service, you agree to these terms and conditions. Children under 13 are not permitted to use this website."),
				BR(),BR(),
				_("While we may attempt to contact you regarding changes to the Agreement, you should visit this page periodically to review the terms. Zoto may modify or revise these terms, conditions and policies at any time, and at its sole discretion. Your continued use of this Service after any such changes constitutes your acceptance of the new terms. Further, these terms and conditions apply exclusively to your access to, and use of, this Service not alter in any way the terms or conditions of any other agreement you may have with Zoto for products, services or otherwise."),
				BR(),BR(),
				_("Nothing in this Agreement shall be deemed to confer any third party rights or benefits."),
				BR(),BR(),BR(),
				H5(_("description of service")),
				BR(),
				_("Zoto is a web based photo organization and publishing site. You understand and agree that the Service is provided on an AS IS and AS AVAILABLE basis. Zoto disclaims all responsibility and liability for the availability, timeliness, security or reliability of the Service. Zoto also reserves the right to modify, suspend or discontinue the Service with or without notice at any time and without any liability to you."),
				BR(),BR(),BR(),
				H5(_("privacy")),
				BR(),
				_("As a condition to using the Service, you agree to the terms of the Privacy Policy as it may be updated from time to time. Zoto understands that privacy is important to you. You do, however, agree that Zoto may monitor, edit or disclose your personal information, including the content of your photos, if required to do so in order to comply with any valid legal process or governmental request (such as a search warrant, subpoena, statute, or court order), or as otherwise provided in these Terms of Use and the Zoto Privacy Policy."),
				BR(),BR(),
				_("Personal information collected by Zoto may be stored and processed in the United States or any other country in which Zoto Inc. or its agents maintain facilities. By using the Zoto Service, you consent to any such transfer of information outside of your country."),
				BR(),BR(),BR(),
				H5(_("registration obligations")),
				BR(),
				_("When requested, each Zoto Service user must: (a) personally provide true, accurate, current and complete information on the Zoto Service's registration form (collectively, the 'Registration Data') and (b) maintain and promptly update the Registration Data as necessary to keep it true, accurate, current and complete. If, after investigation, Zoto has reasonable grounds to suspect that any user's information is untrue, inaccurate, not current or incomplete, Zoto may suspend or terminate that user's account and prohibit any and all current or future use of the Zoto Sites (or any portion thereof) by that user other than as expressly provided herein."),
				BR(),BR(),
				_("Each user will receive passwords and account designations upon completing certain Zoto Service registration processes and is wholly responsible for maintaining the confidentiality thereof and wholly liable for all activities occurring there under. Zoto cannot and will not be liable for any loss or damage arising from a user's failure to comply with this Section, including any loss or damage arising from any user's failure to: (a) immediately notify Zoto of any unauthorized use of his or her password or account or any other breach of security; and (b) ensure that he or she exits from his or her account at the end of each session."),
				BR(),BR(),BR(),
				H5(_("copyright and intellectual property rights")),
				BR(),
				_("All website and software materials, including, without limitation, the Zoto logo, design, text, graphics, other files, and the selection and arrangement thereof are Copyright (C) 2007 Zoto, Inc. ALL RIGHTS RESERVED. Except as stated herein, none of the material may be copied, reproduced, distributed, republished, downloaded, displayed, posted or transmitted in any form or by any means, including, but not limited to, electronic, mechanical, photocopying, recording or otherwise, without the prior written permission of Zoto or the respective copyright owner."),
				BR(),BR(),
				_("Zoto Rights include rights to (a) the Service developed and provided by Zoto; and (b) all software associated with the Service. The Zoto Rights do not include third-party content used as part of Service, including the content of uploaded media appearing on the Service."),
				BR(),BR(),
				_("Zoto grants you a limited license to make personal use only of the Service. Such grant does not include, without limitation: (a) any resale or commercial use of the Service or content therein; (b) the collection and use of any product listings or descriptions; (c) making derivative uses of the Service and its contents; or (d) use of any data mining, robots or similar data gathering and extraction methods. Except as noted above, you are not conveyed any right or license by implication, estoppels or otherwise in or under any patent, trademark, copyright or proprietary right of Zoto or any third party."),
				BR(),BR(),
				_("You may not use, frame or utilize framing techniques to enclose any Zoto trademark, logo or other proprietary information (including the images found at this Site, the content of any text or the layout/design of any page or form contained on a page) without Zoto's express written consent. Further, you may not use any meta tags or any other 'hidden text' utilizing a Zoto name, trademark or product name without Zoto express written consent."),
				BR(),BR(),
				_("Zoto does not claim any ownership or copyright in any of the content, including any text, data, information,images,photographs, music, sound, video, or other material, that you upload, transmit or store in your Zoto account."),
				BR(),BR(),
				_("Zoto respects the intellectual property rights of others, and requires that the people who use the Zoto Service do the same. It is our policy to respond promptly to claims of intellectual property misuse."),
				BR(),BR(),
				_("If you believe that your work has been copied and is accessible on this site in a way that constitutes copyright infringement, you may notify us by providing our copyright agent with the following information in writing:"),
				UL({},
					LI({'style': 'list-style:disc'},_("The electronic or physical signature of the owner of the copyright or the person authorized to act on the owner's behalf;")),
					LI({'style': 'list-style:disc'},_("Identification of the copyrighted work that you claim has been infringed;")),
					LI({'style': 'list-style:disc'},_("Identification of the material that is claimed to be infringing and information reasonably sufficient to permit Zoto to locate the material, including the full URL and, if possible, the MD5 hash of the original photo;")),
					LI({'style': 'list-style:disc'},_("Your name, address, telephone number, and email address;")),
					LI({'style': 'list-style:disc'},_("A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;")),
					LI({'style': 'list-style:disc'},_("A statement, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or are authorized to act on the copyright owner's behalf."))
				),
				BR(),BR(),
				_("If Zoto receives such a claim, Zoto reserves the right to refuse or delete Content as described under the Termination and Cancellation Section."),
				BR(),BR(),
				_("Our designated agent to receive notification of claimed infringement under the Digital Millennium Copyright Act OF 1998 ('DMCA'') is:"),
				BR(),BR(),
				_("Copyright Infringment"),
				BR(),
				_("Zoto, Inc."),
				BR(),
				_("123 South Hudson"),
				BR(),
				_("Oklahoma City, OK 73102"),
				BR(), BR(),
				_("After receiving a claim of infringement, Zoto will process and investigate notices of alleged infringement and will take appropriate actions under the DMCA and other applicable intellectual property laws. Upon receipt of notices complying or substantially complying with the DMCA, Zoto will act expeditiously to remove or disable access to any material claimed to be infringing or claimed to be the subject of infringing activity, and will act expeditiously to remove or disable access to any reference or link to material or activity that is claimed to be infringing. Zoto will take reasonable steps to expeditiously notify the subscriber that it has removed or disabled access to such material."),
				BR(), BR(),
				_("Upon receipt of a proper counter notification under the DMCA, Zoto will promptly provide the person who provided the initial notification of claimed infringement with a copy of the counter notification and inform that person that it will replace the removed material or cease disabling access to it in ten (10) to fourteen (14) business days. Additionally, Zoto will replace the removed material and cease disabling access to it ten (10) to fourteen (14) business days following receipt of the counter notice, unless Zoto's designated agent first receives notice from the person who submitted the initial notification that such person has filed an action seeking a court order to restrain the subscriber from engaging in infringing activity relating to the material on the ZOTO system or network."),
				BR(), BR(),
				_("You may provide us with a counter notification by providing our copyright agent the following information in writing:"),
				UL({},
					LI({'style': 'list-style:disc'},_("Your physical or electronic signature;")),
					LI({'style': 'list-style:disc'},_("Identification of the material that has been removed or to which access has been disabled, and the location at which the material appeared before it was removed or access to it was disabled, including the full URL;")),
					LI({'style': 'list-style:disc'},_("A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material to be removed or disabled;")),
					LI({'style': 'list-style:disc'},_("Your name, address, and telephone number, and a statement that you consent to the jurisdiction of Federal District Court for the judicial district in which your address is located, or if your address is outside of the United States, for any judicial district in which ZOTO may be found and that you will accept service of process from the person who provided the initial notification of infringement."))
				),
				BR(),BR(),
				H5(_("trademarks")),
				BR(),
				_("Zoto, the Zoto logo and the products and services described in this Service, including without limitation zoto.com, zoto.org, zoto.net, 'the best way to share and organize your photos' are either trademarks or registered trademarks of Zoto, and may not be copied, imitated or used, in whole or in part, without the prior written permission of Zoto. In addition, all page headers, custom graphics, button icons and scripts are service marks, trademarks and/or trade dress of Zoto, and may not be copied, imitated or used, in whole or in part, without the prior written permission of Zoto. All other trademarks, registered trademarks, product names and company names or logos mentioned herein are the property of their respective owners."),
				BR(),BR(),BR(),
				H5(_("content")),
				BR(),
				_("All information, data, text, software, music, sound, photographs, graphics, video, messages, or any other materials whatsoever (collectively, 'Content'), whether publicly posted or privately transmitted, is the sole responsibility of the person from whom such Content originated. This means that the user, and not Zoto, is entirely responsible for all Content that he or she uploads, posts, emails or otherwise transmits via the Zoto Service. No user shall transmit Content or otherwise conduct or participate in any activities on Zoto Sites that, in the judgment of Zoto, is likely to be prohibited by law in any applicable jurisdiction, including laws governing the encryption of software, the export of technology, the transmission of obscenity, or the permissible uses of intellectual property."),
				BR(),BR(),
				_("Zoto reserves the right to refuse or delete any Content of which it becomes aware and reasonably deems not to fulfill the Purpose. In addition, Zoto shall have the right (but not the obligation) in its sole discretion to refuse or delete any Content that it reasonably considers to violate the Terms or be otherwise illegal. Zoto, in its sole and absolute discretion, may preserve Content and may also disclose Content if required to do so by law or judicial or governmental mandate or as reasonably determined useful by Zoto to protect the rights, property, or personal safety of Zoto Services' users and the public. Zoto does not control the Content posted to the Zoto Service and, as such, does not guarantee the accuracy, integrity or quality of such Content. Under no circumstances will Zoto be liable in any way for any Content, including, but not limited to, liability for any errors or omissions in any Content or for any loss or damage of any kind incurred as a result of the use of any Content posted, emailed or otherwise transmitted via Zoto Services."),
				BR(),BR(),
				_("Each user, by using Zoto Services, may be exposed to Content that is offensive, indecent or objectionable. Each user must evaluate, and bear all risks associated with the use of any Content, including any reliance on the accuracy, completeness, or usefulness of such Content."),
				BR(),BR(),BR(),
				H5(_("user conduct")),
				BR(),
				_("In using this Service, you agree:"),
				UL({},
					LI({'style': 'list-style:disc'},_("Not to disrupt or interfere with the security of, or otherwise abuse, the Service, or any services, system resources, accounts, servers or networks connected to or accessible through the Service or affiliated or linked Web sites")),
					LI({'style': 'list-style:disc'},_("Not to disrupt or interfere with any other user's enjoyment of the Service or affiliated or linked Web sites;")),
					LI({'style': 'list-style:disc'},_("Not to upload, post or otherwise transmit through or on this Service any viruses or other harmful, disruptive or destructive files;")),
					LI({'style': 'list-style:disc'},_("Not to use or attempt to use another's account, service or system without authorization from Service, or create or use a false identity on this Service;")),
					LI({'style': 'list-style:disc'},_("Not to transmit through or on this Service spam, chain letters, junk mail or any other type of unsolicited mass email to people or entities who have not agreed to be part of such mailings;")),
					LI({'style': 'list-style:disc'},_("Not to attempt to obtain unauthorized access to the Service or portions of the Service that are restricted from general access;"))
				),
				BR(),
				_("In addition, you agree that you are solely responsible for actions and communications undertaken or transmitted under your account, and that you will comply with all applicable local, state, national and international laws and regulations, including but not limited to United States export restrictions, that relate to your use of or activities on this Service."),
				BR(),BR(),BR(),
				H5(_("forums and interactive areas")),
				BR(),
				_("This Service includes discussion forums or other interactive areas. Forums and interactive areas shall be used only for noncommercial purposes. By using any forum or interactive areas, you agree not to do any of the following:"),
				UL({},
					LI({'style': 'list-style:disc'}, _("Upload to, distribute or otherwise publish through this Service any message, data, information, text or other material ('Content') that is unlawful, libelous, defamatory, obscene, pornographic, indecent, lewd, harassing, threatening, invasive of privacy or publicity rights, abusive, inflammatory or otherwise objectionable;")),
					LI({'style': 'list-style:disc'}, _("Upload or transmit any Content that would constitute or encourage a criminal offense, violate the rights of any party, or would otherwise create liability or violate any local, state, national or international law;")),
					LI({'style': 'list-style:disc'}, _("Upload or transmit any Content that may infringe any patent, trademark, trade secret, copyright or other intellectual or proprietary right of any party. By posting any Content, you represent and warrant that you have the lawful right to distribute and reproduce such Content;")),
					LI({'style': 'list-style:disc'}, _("Impersonate any person or entity or otherwise misrepresent your affiliation with a person or entity;")),
					LI({'style': 'list-style:disc'}, _("Without Zoto's written permission, distribute or publish unsolicited promotions, advertising or solicitations for funds, goods or services, including junk mail and spam."))
				),
				BR(),
				_("Zoto takes no responsibility and assumes no liability for any Content posted or uploaded by you or any third party, or for any mistakes, defamation, slander, libel, omissions, falsehoods, obscenity, pornography or profanity you may encounter. Zoto reserves the right but not the obligation to remove any materials it deems objectionable. You agree to hold harmless Zoto and its affiliates and parties with whom Zoto has contracted for purposes of hosting or maintaining this Service from all claims based upon communications made or materials posted by others or the use by third parties of this Service."),
				BR(),BR(),BR(),
				H5(_("account inactivity")),
				BR(),
				_("After a period of inactivity, Zoto reserves the right to disable or terminate a user's account. If an account has been deactivated for inactivity, the username associated with that account may be given to another user without notice to you or such other party."),
				BR(),BR(),BR(),
				H5(_("termination and cancellation")),
				BR(),
				_("Subscription cannot be transferred once purchased."),
				BR(),BR(),
				_("Accounts canceled within 7 days of signup will be entitled to a full refund.  While we practice a 'no questions asked' policy regarding cancelations, we do require that you provide a brief reason for canceling to ensure we understand why you are leaving, and what we could do to make the service better in the future."),
				BR(),BR(),
				_("After the 7 day trial period expires, you may cancel your use of the Services and/or terminate this Agreement, with or without cause, by providing notice to Zoto by using the contact form, provided, however, that a terminated account may continue to exist for up to 72 hours before such cancellation takes effect."),
				BR(),BR(),
				_("Zoto may at any time terminate the Services, terminate this Agreement, or suspend or terminate your account for violations defined in this Agreement. In the event of termination, your account will be disabled and you may not be granted access to your account or any files or other content contained in your account although residual copies of information may remain in our system.  Depending on your local laws, and the terms of the cancelation, you may be entitled to a full or partial refund."),
				BR(),BR(),
				_("Except as set forth above or unless Zoto has previously canceled or terminated your use of the Services (in which case subsequent notice by Zoto shall not be required), if you have provided an alternate email address, Zoto will notify you via email of any such termination or cancellation, which shall be effective immediately upon Zoto's delivery of such notice."),
				BR(),BR(),
				_("Certain Sections of the Agreement, along with applicable provisions of the general Terms of Service (including the section regarding limitation of liability), shall survive expiration or termination."),
				BR(),BR(),BR(),
				H5(_("linking")),
				BR(),
				_("You are granted a limited, nonexclusive right to create a hyperlink to this Site provided such link does not portray Zoto or any of its products and services in a false, misleading, derogatory or otherwise defamatory manner. You may not use a Zoto logo or other proprietary graphic or trademark of Zoto to link to this Site without the express written permission of Zoto. This limited right may be revoked at any time."),
				BR(),BR(),
				_("Zoto makes no claim or representation regarding, and accepts no responsibility for, the quality, content, nature or reliability of sites accessible by hyperlink from this Site, or sites linking to this Site. The linked sites are not under the control of Zoto and Zoto is not responsible for the content of any linked site or any link contained in a linked site, or any review, changes or updates to such sites."),
				BR(),BR(),
				_("Zoto is providing these links to you only as a convenience, and the inclusion of any link does not imply affiliation, endorsement or adoption by Zoto of the site or any information contained therein. When leaving the Zoto site, you should be aware that Zoto's terms and policies no longer govern, and therefore you should review the applicable terms and policies, including privacy and data-gathering practices, of that site."),
				BR(),BR(),BR(),
				H5(_("disclaimers of warranties")),
				BR(),
				_("The products, offerings, content and materials on this website are provided 'as is' and without warranties of any kind, either express or implied. Zoto disclaims all warranties, express or implied, including but not limited to warranties of title or implied warranties of merchantability, fitness for a particular purpose, title, security, accuracy or non-infringement."),
				BR(),BR(),
				_("Neither Zoto, any of our affiliates, nor any of our or their respective licensors, licensees, service providers or suppliers warrant that this website or any function contained in this website will be uninterrupted or error-free, that defects will be corrected, or that this website or the servers that make this website available are free of viruses or other harmful components."),
				BR(),BR(),
				_("Neither Zoto, any of our affiliates, nor any of our or their respective licensors, licensees, service providers or suppliers warrant or make any representations regarding the use or the results of the use of the products, offerings, content and materials (including, without limitation, the fee-based products) in this website in terms of their correctness, accuracy, reliability, or otherwise. Further, please note that no advice or information, obtained by you from our personnel or through this website shall create any warranty not expressly provided for in this agreement."),
				BR(),BR(),BR(),
				H5(_("limitation of liability")),
				BR(),
				_("You expressly understand and agree that Zoto and our affiliates shall not be liable for any direct, indirect, incidental, special, consequential, exemplary or punitive damages, or any other damages whatsoever, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses (even if we have been advised of the possibility of such damages), arising out of, or resulting from, (a) the use or the inability to use this Service; (b) the use of any content or other material on this website or any website or websites linked to this website, (c) the cost of procurement of substitute goods and services resulting from any goods, data, information or services purchased or obtained or messages received or transactions entered into through or from this website; (d) unauthorized access to or alteration of your transmissions or data; (e) statements or conduct of any third party on our website; or (f) any other matter relating to this website. In no event shall our total liability to you for all damages, losses, and causes of action (whether in contract, tort (including, but not limited to, negligence), or otherwise) exceed the amount paid by you, if any, for accessing this website. If you are dissatisfied with any portion of our website, or with any of provision of this agreement, your sole and exclusive remedy is the discontinuation of your use of this website."),
				BR(),BR(),BR(),
				H5(_("no resale of service")),
				BR(),
				_("You agree not to sell, resell, or offer for any commercial purposes, any portion of the Zoto Service, use of the Zoto Service, or access to the Zoto Service."),
				BR(),BR(),
				_("Zoto may terminate a user's account in Zoto's absolute discretion and for any reason. Zoto is especially likely to terminate for reasons that include, but are not limited to, the following: (a) violation of these Terms; (b) abuse of site resources or attempt to gain unauthorized entry to the site or site resources; (c) use of an Zoto Site in a manner inconsistent with the Purpose; (d) a user's request for such termination; or (e) as required by law, regulation, court or governing agency order."),
				BR(),BR(),BR(),
				H5(_("special admonitions for international use")),
				BR(),
				_("Recognizing the global nature of the Internet, you agree to comply with all local rules regarding online conduct and acceptable content. Specifically, you agree to comply with all applicable laws regarding the transmission of technical data exported from the United States or the country in which you reside."),
				BR(),BR(),
				_("Software from this Site (the 'Software') is further subject to United States export controls. No Software may be downloaded from the Site or otherwise exported or re-exported (a) into (or to a national or resident of) Cuba, Iraq, Libya, North Korea, Iran, Syria, or any other Country to which the U.S. has embargoed goods; or (b) to anyone on the U.S. Treasury Department's list of Specially Designated Nationals or the U.S. Commerce Department's Table of Deny Orders. By downloading or using the Software, you represent and warrant that you are not located in, under the control of, or a national or resident of any such country or on any such list."),
				BR(),BR(),BR(),
				H5(_("violations")),
				BR(),
				_("Please report any violations of the Terms (except for claims of intellectual property infringement) to Zoto by using our online "),
				contact_link, ".",
				BR(),BR(),
				_("These Terms and Conditions were last modified on February, 19 2007."),
				BR(),BR()
			)	
		);
	}
});
/*
* zoto privacy policy - zoto_privacy_item()
*/

function zoto_privacy_item(options) {
        options = merge({'title': _("privacy policy")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_PRIVACY";
}
extend(zoto_privacy_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var contact_link_1 = A({'href': "javascript:draw_contact_form()"}, _("contact form"));
		var contact_link_2 = A({'href': "javascript:draw_contact_form()"}, _("contact form"));
		var contact_link_3 = A({'href': "javascript:draw_contact_form()"}, _("contact form"));
		var bbbonline_link = A({'href': "http://www.bbbonline.org/privacy/"}, _("Better Business Bureau Program"));
		replaceChildNodes(this.content_el,
			DIV({'style': "height: 480px; overflow: auto; padding-right: 10px;"},
				_("Zoto is committed to providing you with a safe environment to upload, archive, organize and publish your photos."),
				BR(),BR(),
				_("At Zoto physical, electronic and managerial procedures have been employed to safeguard the security and integrity of personal information. All Zoto employees, agents and contractors with access to personal information obtained on the Zoto web sites are also bound to adhere to this policy as part of their contract with Zoto. To protect the security of information supplied by users accessing Zoto's Service, users are provided usernames and passwords to access their information."),
				BR(),BR(),BR(),
				H5(_("personal information that zoto may collect online")),
				BR(),
				_("When you register with Zoto, we will request some personal information, including your first and last name, and a username and password to create your account. We may also ask you to complete other demographical information such as age, sex, and occupation. For reference, your password will be maintained on our system in an encrypted form. In case you forget your password, we may contact you at your email address with information on how to reset your password."),
				BR(),BR(),
				_("Zoto does not knowingly collect or maintain any personal information from children under the age of 13. In addition, no part of our sites are designed with the purpose of attracting any person under age 13."),
				BR(),BR(),BR(),
				H5(_("how zoto uses personal information collected online")),
				BR(),
				_("Unless you otherwise consent, we will use your personal information only for the purpose for which it is submitted, such as to reply to your emails, handle your complaints, provide operational notices, and to assist us in continued development and improvement of the Service. Our development may lead to the publication of aggregate demographical data but will not result in the reporting or publication of any personal information provided to us."),
				BR(),BR(),
				_("At certain points where personal information is collected on our site, there may be a checkbox where you may indicate you would like to be on a mailing list to receive information about the Zoto Service, and its development. At any time you can add or remove your name from the list by contacting by using the  "),
				contact_link_1, ".",
				BR(),BR(),BR(),
				H5(_("cookies and logging information")),
				BR(),
				_("A cookie is a small data file that is sent to your computer when you first visit a website. As with most website cookies, our cookies include an identification number that is unique to the computer you are using. This identifier helps us better understand our user base and how they are using our site and services."),
				BR(),BR(),
				_("When you visit Zoto and create a Zoto account, we set and access cookies on your computer. We use cookies for a number of reasons, such as recognizing you when you visit the site, displaying the site according to your chosen user settings for language, and maintaining the security of your account. We may use the cookies to collect aggregated information about the use of Zoto to maintain, analyze and improve the service."),
				BR(),BR(),
				_("We believe our cookies improve the quality of our services. If you prefer, however, you can reset your browser so that it refuses all cookies, or notifies you when a cookie is being sent. Although you will still be able to use some parts of Zoto, other parts may not be available if you refuse cookies."),
				BR(),BR(),
				_("Logging information. When you use your Zoto account, we collect certain information (the same information that most web sites log when they are accessed). This information, contained in the header of your request to access the Zoto page, usually includes the browser type you used, your Internet Protocol address, and the date and time of day. In addition, we log the unique ID provided by our cookie and the URL of the last site you visited."),
				BR(),BR(),
				_("As a basic matter, we need this information to help us provide our services to you. For example, we need to validate your identity in order to maintain the security of your account. We also need to know what Internet Protocol address your query came from so we can send the appropriate pages back to you."),
				BR(),BR(),BR(),
				H5(_("how your information may be shared")),
				BR(),
				_("If you find you have uploaded photos you don't want on Zoto's site, you can delete them from your account by clicking on the 'organize' button, then selecting the photo from the lightbox view and clicking on the 'delete' button."),
				BR(),BR(),
				_("We will select certain photos from the system for featured placement on our home page. If you find one of your account's photos is placed on the home page, and you wish for it to be removed, you can use the "),
				contact_link_2, ".",
				BR(),BR(),
				_("Zoto has implemented privacy features that allow you to control who can access your photos and categories.  You may use those features to limit who has access to your photos."),
				BR(),BR(),
				_("We never sell, rent or otherwise make your personal information available to third parties, with the exception of the following circumstances:"),
				UL({},
					LI({},_("Where release is required by law (for example, a subpoena) or regulation or is requested by a government agency;")),
					LI({},_("Detect, prevent, or otherwise address fraud, security or technical issues;")),
					LI({},_("To appropriate persons, where your communication suggests possible harm to others;")),
					LI({},_("To enforce the Zoto Terms of Use, including investigation of potential violations thereof;")),
					LI({},_("To respond to user support requests;")),
					LI({},_("To protect the rights, property or safety of Zoto, its users and the public."))
				),
				BR(),BR(),
				H5(_("transfer of information")),
				BR(),
				_("Personal information collected by Zoto may be stored and processed in the United States or any other country in which Zoto Inc. or its agents maintain facilities. By using Zoto's Service, you consent to any such transfer of information outside of your country."),
				BR(),BR(),
				_("We reserve the right to transfer your personal information in the event of a transfer of ownership of Zoto, such as acquisition by or merger with another company. In such an event, Zoto will notify you before information is transferred and becomes subject to a different privacy policy."),
				BR(),BR(),BR(),
				H5(_("updating your information")),
				BR(),
				_("You can change your Zoto account settings at any time in the settings link at the top of the page, accessible after you are logged in."),
				BR(),BR(),
				_("You can terminate your account at any time, by going into settings and clicking on the 'cancel my account' button at the bottom of the 'account status' page. "), 
				_("We typically deactivate accounts within 72 hours of such requests. You should be aware, however, that residual copies of information may remain stored on our systems even after the deletion of information or the termination of your account."),
				BR(),BR(),BR(),
				H5(_("problems or complaints with zoto's privacy policy")),
				BR(),
				_("If you have a complaint about Zoto's compliance with this privacy policy, you may contact us by using our "),
				contact_link_3, ". ",
				_("If you feel we were unable to resolve your complaint to your satisfaction, you may elect to proceed with the "),
				bbbonline_link,
				_(" by completing the proper forms on their site."),
				BR(),BR()
			)
		);
	}
});
/*
* zoto contact - zoto_contact_item()
*/

function zoto_contact_item(options) {
        options = merge({'title': _("contact us")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_CONTACT";
}
extend(zoto_contact_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var contact_link = A({'href': "javascript:draw_contact_form()"}, _("contact form"));
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("The primary way of contacting us should be by using our online "),
				contact_link, ".",
				BR(),BR(),
				_("However, you may find it necessary to contact us through more traditional methods.  Before you do so, you should be aware that we do NOT provide online technical support via the phone, fax, or in person."),
				BR(),BR(),
				_("While we welcome a friendly call from a user regarding other issues, we will most definitely remind you that we don't take technical support calls over the phone, if that's what you are calling about!  If you find you are in the neighborhood, please remember that you must bring chocolate to gain entry to our office."),
				BR(),BR(),
				_("Zoto's offices are currently located in Oklahoma City, Oklahoma, but we also have a Mountain View, California phone number provided by Vonage.  No, we aren't neighbors with Google."),
				BR(),BR(),
				_("You can write or visit Zoto's office at:"),
				BR(),
				STRONG({}, _("Zoto, Inc.")), 
				BR(),
				STRONG({}, _("123 South Hudson")), 
				BR(),
				STRONG({}, _("Oklahoma City, OK 73102")), 
				BR(),BR(),
				_("You can call or fax Zoto at:"),
				BR(),
				STRONG({},_("(v) 650.641.0108")),
				BR(),
				STRONG({},_("(f) 650.641.0116")),
				BR(),BR()
			)
		);
	}
});
/*
* zoto crew - zoto_crew_item()
*/

function zoto_crew_item(options) {
        options = merge({'title': _("the crew")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_OVERVIEW_CREW";
}
extend(zoto_crew_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var kbarrett = DIV({'style': "text-align: center; float: left; margin-right: 15px; margin-bottom: 5px;"}, A({'href': currentWindow().site_manager.make_url("kbarrett")}, IMG({'src': "/kbarrett/avatar-small.jpg", 'style': "border: none; margin-bottom: 5px;"}), DIV({}, _("Kara Barrett"))), DIV({}, _("Designer")));
		var kordless = DIV({'style': "text-align: center; float: left; margin-right: 15px; margin-bottom: 5px;"}, A({'href': currentWindow().site_manager.make_url("kordless")}, IMG({'src': "/kordless/avatar-small.jpg", 'style': "border: none; margin-bottom: 5px;"}), DIV({}, _("Kord Campbell"))), DIV({}, _("CEO")));
		var eric = DIV({'style': "text-align: center; float: left; margin-right: 15px; margin-bottom: 5px;"}, A({'href': currentWindow().site_manager.make_url("eric")}, IMG({'src': "/eric/avatar-small.jpg", 'style': "border: none; margin-bottom: 5px;"}), DIV({}, _("Eric Johnson"))), DIV({}, _("Coder")));
		var clint = DIV({'style': "text-align: center; float: left; margin-right: 15px; margin-bottom: 5px;"}, A({'href': currentWindow().site_manager.make_url("clint")}, IMG({'src': "/clint/avatar-small.jpg", 'style': "border: none; margin-bottom: 5px;"}), DIV({}, _("Clint Robison"))), DIV({}, _("Coder")));
		var vman = DIV({'style': "text-align: center; float: left; margin-right: 15px; margin-bottom: 5px;"}, A({'href': currentWindow().site_manager.make_url("vman")}, IMG({'src': "/vman/avatar-small.jpg", 'style': "border: none; margin-bottom: 5px;"}), DIV({}, _("Josh Williams"))), DIV({}, _("Architect")));
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("We're a small, scrappy bunch of techno-geeks temporarily located in the tech wasteland known as Oklahoma.  Endowed with mad programming skills and a crazy entrepreneurial spirit, we wrangle code so you don't have to."),
				BR(),BR(),
				kbarrett,
				kordless,
				eric,
				clint,
				vman,
				BR(),BR()
			)
		);
	}
});
/*********************************************************
*					UPLOADING PHOTOS
*********************************************************/
/*
 * uploading photos - zoto_uploading_menu()
 */
function zoto_uploading_menu(options) {
	this.$uber(options);
}
extend(zoto_uploading_menu, zoto_help_modal_menu, {
	activate: function() {
	}
	
});

/*
* uploading overview
*/
function zoto_uploading_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
}
extend(zoto_uploading_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var screen_shot = IMG({'src': "/image/help/help_uploader_overview.jpg"});
		var goto_install = A({'href': "javascript:currentDocument().help_modal.show_context('HELP_INSTALL')"}, _("Get started installing the uploader!"));
		var uploader_client = A({'href': "javascript:currentDocument().help_modal.show_context('HELP_INSTALL')"}, _("uploader client"));
		var adding_support = A({'href': "javascript:currentDocument().help_modal.show_context('FUTURE_SUPPORT')"}, _("adding support"));
		replaceChildNodes(this.content_el,
			SPAN({}, _("In order to have photos in your Zoto account you need to upload them to us first.")),
			BR(), BR(),
			SPAN({}, _("Zoto currently provides two ways to upload photos to your account - a piece of software that we call the '"), uploader_client, _("', and a web upload form for uploading a few photos at a time.")),
			BR(), BR(),
			SPAN({}, _("Zoto's uploader software is fast and easy to use, provides tagging while uploading, and allows you to create batches of photos for uploading and tagging.")),
			BR(), BR(),
			screen_shot,
			BR(), BR(),
			goto_install
		);
	}
});

/*
* using the uploader - zoto_uploading_item()
*/

function zoto_uploading_item(options) {
	options = merge({'title': _("using the uploader")}, options);
	this.$uber(options);
	this.help_attribute = "HELP_UPLOADING";
}
extend(zoto_uploading_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var need_more_help = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_TUTORIALS_USE_UPLOADER')"}, "watch the uploader video tutorial");
		var web_upload_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_WEB_UPLOADING')"}, "upload photos a few at a time");
		replaceChildNodes(this.content_el,
			SPAN({},
				_("The Zoto photo uploader supports batched uploads. You can drag and drop single directories, start uploading them, then start working on another batch while the first one is uploading.  When you are done, walk away, and the uploader will take care of the rest."),
				BR(), BR(),
				_("You can also "), web_upload_link, _(" using your browser."), 
				BR(), BR(), BR(),
				H5({}, _("1. launch the uploader and login")),
				BR(),
				_("When the uploader starts, login with your Zoto account information.  You can add multiple accounts to the uploader client."),
				BR(), BR(), BR(),
				H5({}, _("2. drag and drop photos into the uploader")),
				BR(),
				_("Select the photos, or directory of photos, that you want to upload and drag them into the uploader area that says 'drag & drop photos here'."),
				BR(), BR(), BR(),
				H5({}, _("3. upload and tag")),
				BR(),
				_("Click on the 'upload' button at the bottom and then enter any tags you want to appear on that set of photos.  Click on the 'finish' button to start your upload."),
				BR(),BR(),BR(),
				_("If you need additional help using the uploader, you can "), need_more_help, "."
			)
		);
	}
});
/*
* installing the uploader
*/
function zoto_install_item(options) {
        options = merge({'title': _("install the uploader")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_INSTALL";
}
extend(zoto_install_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var mac_intel = A({'href':"http://www." + zoto_domain + "/download/zoto_uploader_3.0.1.intel.dmg"}, _("download"));
		var mac = A({'href':"http://www." + zoto_domain + "/download/zoto_uploader_3.0.1.ppc.dmg"}, _("download"));
		var win = A({'href':"http://www." + zoto_domain + "/download/zoto_uploader_3.0.1.exe"}, _("download"));
		var linux = A({'href':"http://www." + zoto_domain + "/download/zoto_uploader_3.0.1.tar.gz"}, _("download"));
		var need_more_help = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_TUTORIALS_INSTALL_UPLOADER')"}, "uploader installation video tutorial");
		platform_list = DIV({'id': "platform_list"}, DIV({'id': "windows_platform", 'class': "platform"}), SPAN({}, _("Uploader for Windows")), BR(), win); 
		replaceChildNodes(this.content_el,
			SPAN({}, _("The Zoto Uploader runs on OSX, Windows and Linux.  To get started, click on 'download' under the operating system you are running.  Your browser will ask you where to save the file - be sure to save it in an easy-to-remember location.  ")),
			BR(), BR(),
			DIV({'id': "platform_list"}, 
				SPAN({'style': "font-size: 16px;"},	_("1. choose your platform")),
				BR(),BR(),
				DIV({'id': "apple_platform", 'class': "platform"},
					EM({}, _("Zoto Uploader for OSX")),
					BR(),
					mac_intel, _(" 3.3 MB .dmg for x86"),
					BR(),
					mac, _(" 3.2MB .dmg for PPC")
				),
				DIV({'id': "windows_platform", 'class': "platform"},
					EM({}, _("Zoto Uploader for Windows")),
					BR(),BR(),
					win, _(" 3.3 MB .exe")
				),
				DIV({'id': "linux_platform", 'class': "platform"},
					EM({}, _("Zoto Uploader for Linux")),
					BR(),BR(),
					linux,
					_(" 265 KB .tar.gz source")
				)
			),
			BR({'clear': "left"}), BR(),
			SPAN({'style': "font-size: 16px;"}, _("2. install the software")),
			BR(),BR(),
			_("Windows users will need to browse to the file on their computer and double click on the .exe file to launch the installer."),
			BR(),BR(),
			_("OSX users will need to mount the .dmg image first by double-clicking on it, then dragging the Zoto Uploader icon (a flower) into the applications folder."),
			BR(),BR(),
			_("Linux and other operating systems users will need to open the .tar.gz file and read the encolosed README document for further instructions."),
			BR(), BR(),
			SPAN({}, _("You may also want to watch the "), need_more_help, ".")
		);
	}
});

/*
* web uploading
*/
function zoto_web_uploading_item(options) {
	options = merge({'title': _("web uploading")}, options);
	this.$uber(options);
	this.help_attribute = "HELP_WEB_UPLOADING";
}
extend(zoto_web_uploading_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var upload_link_screen_shot = IMG({'src': "/image/help/upload-link.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var install_uploader = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_INSTALL')"}, _("installing the uploader client "));
		replaceChildNodes(this.content_el,
			DIV({},
				_("Web uploads should be used for uploading a few photos at a time.  We highly suggest "), 
				install_uploader,
				_(" as it will make it easier for you to upload large numbers of photos at a time to your account."),
				BR(),BR(),
				_("Web uploading on Zoto is done using a customized Flash uploader, so it is required that you have Flash 8 or above installed to use it.  Remember, the uploader client doesn't require Flash."),
				BR(),BR(),BR(),
				H5({}, _("1. make sure you are logged into your account")),
				BR(),
				SPAN({},
					upload_link_screen_shot,
					_("To upload to Zoto, you'll need to be logged into your account.  Once you are logged in, you should see the 'upload' link at the top right of the page."),
					BR(),BR()
				),
				BR(),
				H5({}, _("2. click on the upload link")),
				BR(),
				_("The upload link will open up a small modal on the page.  Click on the 'choose photos to upload' button to open a file browser window."),
				BR(),BR(),BR(),
				H5({}, _("3. select your photos to upload")),
				BR(),
				_("Select the photos to upload.  You can upload multiple photos by doing a multi-select in the file browser window.  In Windows, hold down the shift or control key when selecting images.  In OSX, hold down the Apple-option key to select multiple images."),
				BR(),BR(),
				_("To start uploading the photos you've selected, click on the 'select' button.  You will see a progress bar appear indicating the amount of time that it will take to upload.")
			)
		);
	}
});
/*
* supported files
*/
function zoto_supported_files_item(options) {
        options = merge({'title': _("file support")}, options);
        this.$uber(options);
}
extend(zoto_supported_files_item, zoto_help_modal_item, {
	activate: function() {
		var a_terms = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_OVERVIEW_TERMS");'}, _("Terms of Use"));
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({},
				_("Zoto's website stores JPG files only.  Zoto is a photo sharing site, designed to store photos taken by a digital camera.  Almost all digital cameras store their images via a JPG file format, so it just made sense to only support JPG.  However, with enough demand, Zoto may add support for additional file formats, including RAW and AVI files, both of which are technically generated and supported by digital cameras."),
				BR(),BR(),BR(),
				H5({}, _("uploader file format support")),
				BR(),
				_("Zoto's uploader supports converting a wide variety of file formats including JPG, GIF, BMP, and TIF.  However, the uploader client converts these different file formats to JPGs before the file is upload to Zoto.  The resulting image will be a JPG on Zoto's site, and the original image will NOT be stored on our servers."),
				BR(),BR(),BR(),
				H5({}, _("file size support")),
				BR(),
				_("Zoto's accounts have unlimited storage capabilities.  However, be sure you read the "), a_terms, _(", as Zoto can't be used for storing photos that aren't yours, or photos for which you do not hold the copyright.  Basically if you upload photos to Zoto, they must either taken by you, or authorized for your own personal use."),
				BR(),BR(),
				_("Zoto will store JPG photos up to 20MB in size.  If you have images larger than 20MB, you'll need to downsize them before you upload them to us."),
				BR(),BR(),BR()
			)
		);
	}
});
/*
* uploading future support
*/
function zoto_uploading_future_support_item(options) {
        options = merge({'title': _("future support")}, options);
        this.$uber(options);
	this.help_attribute = "FUTURE_SUPPORT";
}
extend(zoto_uploading_future_support_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({},
				_("Zoto's infrastructure provides for numerous ways of uploading photos to the system.  Through Zoto's API (documentation coming soon), any photo sharing application could, in theory, be configured to upload photos to Zoto.  As more uploading applications become available, we will provide links to them here in the help section."),
				BR(),BR(),BR(),
				H5({}, _("uploading via email")),
				BR(),
				_("In previous versions of Zoto we provided methods by which photos could be emailed into the system for storage in your account.  This method is especially handy for those of you with camera phones wishing to email images to your account."),
				BR(),BR(),
				_("Due to the timeline of the release of Zoto 3.0, we were forced to cut this feature until a later release date.  We will be implementing this feature in the coming months as we add new features to Zoto 3.0."),
				BR(),BR(),BR(),
				H5({}, _("exporting from other services")),
				BR(),
				_("Photo sharing services with robust API's should be able to communicate with each other.  In that vein, with the release of Zoto 3.0, we have included a 'send to Flickr' feature that allows you to take photos on Zoto and post them to your Flickr account."),
				BR(),BR(),
				_("In the coming months we will be adding support for publishing your images to other photo sharing sites, including SmugMug and Picassa.  We are also planning on implementing a 'pull from Flickr' feature, that will allow you to move images from Flickr to your Zoto account."),
				BR(),BR(),
				_("It is our hope that these other services will take notice of Zoto's practice and start providing methods for their own users to move photos from service to service."),
				BR(),BR(),BR() 
			)
		);
	}
});
/*********************************************************
*					YOUR HOMEPAGE
*********************************************************/
/*
 * zoto account - zoto_account_menu()
 */
function zoto_account_menu(options) {
	this.$uber(options);
}

extend(zoto_account_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});

/*
* account overview
*/
function zoto_account_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ACCOUNT_OVERVIEW";
}
extend(zoto_account_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var nav_screen_shot = IMG({'src': "/image/help/navigation-links.png"});
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Account functions on Zoto are accessible once you are logged into the system.  If you aren't logged in, click on the 'login' link at the top right corner of the page."),
				BR(),BR(),
				_("If you login from the main homepage of Zoto, you will be taken to your homepage.  If you login from another location on the site, you will need to click on your username link at the top left to navigate to your homepage."),
				BR(),BR(),BR(),
				H5({}, _("navigation")),
				BR(),
				_("Zoto provides three areas of navigation for your account - 1. the user links next to the avatar at the top left, 2. the system links at the top right, and 3. the content tabs to the top right."),
				BR(),BR(),
				nav_screen_shot,
				BR(),BR(),BR(),
				H5({}, _("content tabs")),
				BR(),
				_("Content on Zoto is separated using the tabs.  If you want to search for photos in your account, you'll need to be on your account tab.  If you navigate to another user's account, their tab will appear, letting you search their photos using the search box.  Use the 'explore' tab to search public photos across all of Zoto's accounts."),
				BR(),BR(),
				_("Additionally, you can use the 'forum' tab to participate in Zoto's forums, or the 'blog' tab to read Zoto's company blog.")
			)
		);
	}
});
/*
* homepage 
*/
function zoto_account_homepage_item(options) {
        options = merge({'title': _("your homepage")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ACCOUNT_HOMEPAGE";
}
extend(zoto_account_homepage_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var widget_screen_shot = IMG({'src': "/image/help/moving-widgets.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Zoto's homepages provide additional ways to navigate your account, and display the information and photos that are interesting to you and others looking at your page.  You can place different elements on the page, including recent photos, comments made by you and others, photos from contacts, photos from your albums, and more."),
				BR(),BR(),BR(),
				H5({}, _("Widgets")),
				BR(),
				_("The homepage is comprised of 'widgets' that can be added or removed, and moved around to different areas on the page.  To move a widget, grab it by the top bar and drag it to a new area on the page."),
				BR(),BR(),
				SPAN({}, 
					widget_screen_shot, 
					_("1. To add widgets to your homepage select the 'add widgets' link located in the menu beneath your avatar at the top left."),
					BR(),BR(),
					_("2. To remove a widget, simply click on the 'remove' link next to the widget that you want to remove."),
					BR(),BR(),
					_("3. Widgets that can be customized will have an 'edit' link at the top right corner of their window.")
				)
			)
		);
	}
});
/*
* account profile
*/
function zoto_account_profile_item(options) {
        options = merge({'title': _("settings & profile")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ACCOUNT_PROFILE";
}
extend(zoto_account_profile_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var profile_screen_shot = IMG({'src': "/image/help/profile.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Your account settings, including your account profile, can be changed by clicking on the 'settings' link in the top right navigation."),
				BR(),BR(),BR(),
				H5({}, _("status overview")),
				BR(),
				_("The settings page gives you a status overview of your account, and provides links for renewing or canceling your account.  You can use the accordion menus to the left to access different sections of your settings.  Most of the pages in settings contain detailed help for using them."),
				BR(),BR(),BR(),
				H5({}, _("profile info")),
				BR(),
				SPAN({}, 
					profile_screen_shot,
					_("The 'edit profile info' section provides you the ability to change your profile information, some of which is used for building the profile widget that can appear on your homepage."),
					BR(),BR(),
					_("If you leave fields blank, they will not be used on your profile widget.")
				),
				BR({'clear': "all"}),BR(),
				H5({}, _("profile behaviors")),
				BR(),
				_("In addition to your descriptive profile info, the profile page contains a timezone setting, email visibility and contact adding behavior settings.  Setting your email visibility controls whether or not other users can see your email address, and contact behavior controls whether or not you need to authenticate other users to add you as a contact."),
				BR(),BR(),BR()
			)
		);
	}
});
/*
* account avatar
*/
function zoto_account_avatar_item(options) {
        options = merge({'title': _("set your avatar")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ACCOUNT_AVATAR";
}
extend(zoto_account_avatar_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var avatar_screen_shot = IMG({'src': "/image/help/avatar.png", 'style': "display: inline; float: left; margin-left: 6px;"});
		var selector_screen_shot = IMG({'src': "/image/help/avatar-selector.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("On most Zoto pages, when you are in either your account or another users account, an image will appear next to your username in the top left. This image is known as your 'avatar'.  It can be set to any image that is in your Zoto account."),
				BR(),BR(),
				avatar_screen_shot,
				BR({'clear': "all"}), BR(),BR(),
				H5({}, _("picking a new avatar")),
				BR(),
				_("To personalize your avatar, you will need to be on your homepage, which you can get to by clicking the 'homepage' link.  Once on your homepage, you can bring up the 'select your new avatar' modal by clicking the 'set avatar' link in the menu that appears below your username/avatar on the left side of the page."),
				BR({'clear': "all"}), BR(),
				SPAN({},
					selector_screen_shot,
					_("You can use the search box to find the exact photo you want to use for your avatar.  You can also use the pagination at the bottom to page through your photos."),
					BR(),BR(),
					_("Once you've found the photo you want to use, select it then click on the 'set selected image as my avatar' button.")
				)
			)
		);
	}
});
/*
* account avatar
*/
function zoto_account_messaging_item(options) {
        options = merge({'title': _("messaging")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ACCOUNT_MESSAGING";
}
extend(zoto_account_messaging_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var messaging_link_screen_shot = IMG({'src': "/image/help/messaging-link.png", 'style': "display: inline; float: left; margin-left: 6px;"});
		var messaging_screen_shot = IMG({'src': "/image/help/messaging-link.png", 'style': "display: inline; float: left; margin-left: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Zoto has a built in messaging system that notifies you when system events occur, like comments on your photos, or invites from other contacts.  Messaging on Zoto is similar to existing web email systems - just a lot simpler."),
				BR(),BR(),
				H5({}, _("accessing your messages")),
				BR(),
				_("To access your messages, click on the email link in the top right navigation.  Zoto will show you how many unread messages are in your inbox next to the mail icon."),
				BR(),BR(),
				messaging_link_screen_shot,
				BR({'clear': "all"}),
				BR(),
				H5({}, _("using messaging")),
				BR(),
				_("To create a new message click on the 'new message' button at the top of your message list.  The recipient name will need to be the username of the user on Zoto's system.  Note: you cannot send email to Internet email addresses."),
				BR(),BR(),
				_("You can select multiple messages by clicking on 'select all' and you can delete messages by clicking on the 'delete selected' button.  You can also delete images by clicking on the 'delete' button when reading a message."),
				BR(),BR(),BR(),
				H5({}, _("inbox and sent messages")),
				BR(),
				_("Use the list to the left of your messages to switch between your 'inbox' and 'sent messages'.  You can also use the bread crumb navigation at the top left to go back to the main messages page at any time.")
			)
		);
	}
});
/*********************************************************
*					VIEWING PHOTOS
*********************************************************/
function zoto_viewing_photos_menu(options) {
	this.$uber(options);
}

extend(zoto_viewing_photos_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* viewing photos item - overview
*/

function zoto_viewing_photos_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_VIEWING";
}
extend(zoto_viewing_photos_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var lightbox_screen = IMG({'src': "/image/help/lightbox-screen.png"});
		var lightbox_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_VIEWING_LIGHTBOX')"}, _("lightbox page"));
		var photo_modal_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_VIEWING_PHOTO_MODALS')"}, _("the photo detail modal"));
		var photo_detail_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_VIEWING_IMAGE_DETAIL')"}, _("the photo detail page"));
		replaceChildNodes(this.content_el,
			DIV({},
				_("Zoto's site is designed to let you quickly find and view your photos.  Much like a photo sharing application that you run on your computer, Zoto displays thumbnails of your photos in various locations, and allows you to view larger sized versions when you click on the thumbnails."),
				BR(),BR(),BR(),
				H5({}, _("the lightbox")),
				BR(),
				_("The "),
				lightbox_link,
				_(" is the primary display by which Zoto shows you the photos that are in your account.  The lightbox can be accessed by clicking on the 'photos' link in the top left corner of any of your account's pages."),
				BR(),BR(),
				lightbox_screen,
				BR(),BR(),
				_("Alternately, you can access the lightbox from widgets that you have placed on your homepage, or by clicking on tag links that are displayed in tag clouds or on photos."),
				BR(),BR(),BR(),
				H5({}, _("photo detail pages")),
				BR(),
				_("Larger size versions of your photos are displayed in two different ways - "),
				photo_modal_link,
				_(" and "),
				photo_detail_link,
				".",
				_("The photo detail page is accessed by clicking on a thumbnail in your account, and then by clicking on the image in the modal, or on the 'view image detail page' link at the bottom.")
			)
		);
	}
});
/*
* viewing photos item - lightbox
*/

function zoto_viewing_photos_lightbox_item(options) {
        options = merge({'title': _("lightbox")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_VIEWING_LIGHTBOX";
}
extend(zoto_viewing_photos_lightbox_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var page_screen = IMG({'src': "/image/help/pagination-screen.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var sort_screen = IMG({'src': "/image/help/sort-order-screen.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var view_screen = IMG({'src': "/image/help/view-mode-screen.png", 'style': "display: inline; float: left; margin-right: 6px;"});		
		replaceChildNodes(this.content_el,
			DIV({},
				_("Zoto's lightbox shows photos in your account on a page of small to medium sized thumbnails.  The top status bar shows how many photos are in the set, how many are being displayed and ranges on the photos being currently viewed."),
				BR(),BR(),BR(),
				H5({}, _("page navigation")),
				BR(),
				_("The lightbox breaks up the number of photos in your account into separate 'pages'.  Pages are viewed by using the 'paginator' widget, which is located at the top and bottom of your lightbox page."),
				BR(),BR(),
				page_screen,
				_("To navigate to the next 'page' of photos, you can either click on the left and right arrows, click on a page number, or type in a page number in the text entry box."),
				BR({'clear': "all"}),
				BR(),BR(),
				H5({}, _("sort order and number of photos per page")),
				BR(),
				sort_screen,
				_("Use the two pulldowns at the top of your thumbnails to select how Zoto should sort your images, and how many to show you on a page."),
				BR({'clear': "all"}),
				BR(),BR(),
				H5({}, _("view modes")),
				BR(),
				view_screen,
				_("There are four different view modes for the lightbox: list view, minimal view, small thumbs, and large thumbs.  Except in minimal thumbs view, Zoto will show you the corresponding sort order values next each of the thumbnails."),
				BR({'clear': "all"})
			)
		);
	}
});
/*
* viewing photos item - photo modals
*/

function zoto_viewing_photos_photo_modals_item(options) {
        options = merge({'title': _("photo modals")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_VIEWING_PHOTO_MODALS";
}
extend(zoto_viewing_photos_photo_modals_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var prev_next_screen = IMG({'src': "/image/help/prev-next-screen.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		var side_info_screen = IMG({'src': "/image/help/image-detail-side-info.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var photo_detail_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_VIEWING_IMAGE_DETAIL')"}, _("photo detail page"));
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Photo detail 'modals' are used to display larger sized images when you click on thumbnails in your account.  These modal windows don't require a page reload, and load quickly to enable you to browse the photos in your account more efficiently."),
				BR(),BR(),BR(),
				H5({}, _("navigating with photo detail modals")),
				BR(),
				_("Once a modal appears, you can navigate to the previous or next photo in the set by using the 'prev' and 'next' buttons at the top right."),
				BR(),BR(),
				prev_next_screen,
				BR({'clear': "all"}),
				BR(),
				_("To close the modal, simply click on the 'x' at the top right, or click off the modal in the dimmed out area of the page."),
				BR(),BR(),
				_("Clicking on the image in the modal, or the 'view image detail page' link will take you to the "),
				photo_detail_link,
				_(". "),
				BR(),BR(),BR(),
				H5({}, _("tag, album and date links")),
				BR(),
				side_info_screen,
				_("If you have tags on the photo, or the photo is contained in an album, the link for it will appear on the right side of the photo.  If the photo contained a 'date taken' value when it was uploaded, a date link will also appear."),
				BR(),BR(),
				_("Clicking on the links will navigate you to a lightbox containing the photos in that tag, album, or date.")
			)
		);
	}
});
/*
* viewing photos item - image detail
*/

function zoto_viewing_photos_image_detail_item(options) {
        options = merge({'title': _("photo detail")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_VIEWING_IMAGE_DETAIL";
}
extend(zoto_viewing_photos_image_detail_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var other_sizes_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_VIEWING_OTHER_SIZES')"}, _("other sizes modal"));
		var filmstrip_screen = IMG({'src': "/image/help/filmstrip-screen.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("The photo detail page is used to display your account's largest sized images.  The detail page also contains more information than the photo detail modal, including comments people have made on the photo, EXIF information, and options for viewing "),
				other_sizes_link,
				(" of the photo."),
				BR(),BR(),
				_("You can get to the photo detail page by clicking on a thumbnail in the lightbox, then clicking on the larger sized image in the modal that pops up."), 
				BR(),BR(),BR(),
				H5({}, _("navigation on the photo detail page")),
				BR(),
				filmstrip_screen,
				_("A filmstrip at the top right provides a way to scan through photos in your account.  The filmstrip thumbnails are ordered by the date uploaded the photos were uploaded."),
				BR(),BR(),
				_("The thumbnails represent the previous two photos before the large one, and the next two photos after it.  You can also use the 'prev' and 'next' buttons to scan back and forth in your photo pool."),
				BR({'clear': "all"}),
				BR(),BR(),
				H5({}, _("tags and album links")),
				BR(),
				_("If you have tags on the photo, or if the photo contained a 'date taken' value when it was uploaded, links to them will be available to the right. "),
				_("Clicking on the tag or date links will navigate you to a lightbox page containing the photos in that tag or in that date."),
				BR(),BR(),BR(),
				H5({}, _("browsing albums and all photos")),
				BR(),
				_("Links to albums will open a 'lightbox modal' that contains the rest of the photos that are in the same album."),
				_(" The 'browse' link above the filmstrip works in the same way, except it shows you all the photos in your account.")
			)
		);
	}
});
/*
* viewing photos item - EXIF info
*/

function zoto_viewing_photos_exif_item(options) {
	options = merge({'title': _("EXIF info")}, options);
	this.$uber(options);
	this.help_attribute = "HELP_VIEWING_EXIF_INFO";
}
extend(zoto_viewing_photos_exif_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var set_date_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_ORGANIZE_EDITING')"}, _("edit the date taken"));
		var exif_info_screen = IMG({'src': "/image/help/view-exif-info.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({},
				_("EXIF data is data that your camera writes to the photos you upload to your account.  Not all cameras write EXIF data, and some image editors (like Photoshop) may remove or change the EXIF on a photo."),
				BR(),BR(),BR(),
				H5({}, _("EXIF dates")),
				BR(),
				_("Zoto uses EXIF data to figure out when a photo was taken.  If the photo doesn't contain a valid 'date-taken' field in the EXIF data, Zoto will assume that the photo doesn't have a valid date on it.  You can "),
				set_date_link,
				_(" yourself if your camera didn't set it correctly."),
				BR(),BR(),BR(),
				H5({}, _("making use of other EXIF data")),
				BR(),
				_("If the EXIF is available, the photo detail page will show you the settings your camera used when taking a photo.  You can also use these values to sort your images in the lightbox, allowing you to find a photo with a particular lens on it, or a photo taken by a particular camera."),
				BR(),BR(),
				exif_info_screen
			)
		);
	}
});
/*
* viewing photos item - searching
*/

function zoto_viewing_photos_searching_item(options) {
        options = merge({'title': _("searching")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_VIEWING_SEARCHING";
}
extend(zoto_viewing_photos_searching_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var searching_screen = IMG({'src': "/image/help/searching-screen.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var calendar_screen = IMG({'src': "/image/help/calendar-screen.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({},
				_("You can search for photos in your Zoto account by title, description, tag, or date.  The more you describe your photos with tags, the easier it is to find them later by searching."),
				BR(),BR(),
				searching_screen,
				_("Searching is done by context, so to search your account for photos you'll need to be on your account tab at the top right.  If you want to search all of Zoto for photos, simply click the 'explore' tab, then type in your search term."),
				BR({'clear': "all"}),
				BR(),BR(),
				H5({}, _("simple searches")),
				BR(),
				_("Simple searches can be done by clicking on a tag in a 'tag cloud' or a tag list.  These searches return photos that are tagged with the tag you clicked on."),
				BR(),BR(),
				_("Simple searches can also be performed by entering text in the search box at the top right.  Results for searches done in the text box will include any matches on tag, title or description."),
				BR(),BR(),BR(),
				H5({}, _("searching by date")),
				BR(),
				calendar_screen,
				("When you are viewing a photo in the lightbox, or on the photo detail page, you may see links to dates that you can click on to load a lightbox of photos in your account from that date.  Alternately, you can use the calendar to the left of your thumbnails on the lightbox page to find photos by year, month, or day."),
				BR({'clear': "all"}),				
				BR(),BR(),
				H5({}, _("complex searches")),
				BR(),
				_("You can do complex searches on Zoto by typing in certain keywords in the search box.  By using the keyword 'and', you can search for intersections of search terms.  For example searching for 'connor' and 'lily' would return only photos that contain both tags of Connor and Lily.  ")
			)
		);
	}
});
/*
* viewing photos item - other sizes
*/

function zoto_viewing_photos_other_sizes_item(options) {
        options = merge({'title': _("other sizes")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_VIEWING_OTHER_SIZES";
}
extend(zoto_viewing_photos_other_sizes_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var show_url_screen = IMG({'src': "/image/help/show-url-screen.png", 'style': "display: inline; float: right; margin-left: 10px;"});
		var custom_size_screen = IMG({'src': "/image/help/custom-size-screen.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		var showing_size_screen = IMG({'src': "/image/help/showing-size-screen.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		var photo_detail_link = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_ORGANIZE_EDITING')"}, _("photo detail modal page"));
		replaceChildNodes(this.content_el,
			DIV({},
				_("Zoto can generate any desired size image from photos in your account.  We store several different 'canned' sizes, but you can also request custom sizes for use as desktop backgrounds, or for linking to photo in your account from other web pages on the Internet."),
				BR(),BR(),BR(),
				H5({}, _("using the other sizes modal")),
				BR(),
				_("The other sizes modal is accessed by clicking on the 'other sizes' button below the large image on the "),
				photo_detail_link,
				".",
				BR(),BR(),
				showing_size_screen,
				BR({'clear': "all"}),
				BR(),
				_("Once the 'other sizes' modal pops up, select from the list of pre-rendered sizes for the photo.  If you need the original downloaded to your computer, click on the 'original' link."),
				BR(),BR(),BR(),
				H5({}, _("custom sizes")),
				BR(),
				custom_size_screen,
				_("You can also generate a custom sized image by using the two text entry boxes at the bottom.  For example, if your desktop background needs to be 1600x1200, you can enter 1600 for the width and 1200 for the height.  Clicking on 'exact size' will cause Zoto to crop the image to fit in those dimensions."),
				BR({'clear': "all"}),
				BR(),BR(),
				H5({}, _("getting links for photos")),
				BR(),
				show_url_screen,
				_("You can cut and paste the URL that appears in your browser's location bar to use on other websites.")
			)
		);
	}
});
/*********************************************************
*					ORGANIZING PHOTOS
*********************************************************/
function zoto_organizing_menu(options) {
	this.$uber(options);
}

extend(zoto_organizing_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* organizing by titles and description
*/
function zoto_organizing_overview_item(options) {
        options = merge({'title': _("overview")}, options);
	this.help_attribute = "HELP_ORGANIZE_OVERVIEW";
        this.$uber(options);
}
extend(zoto_organizing_overview_item, zoto_help_modal_item, {
	activate: function() {
		var single_edit_screen_shot = IMG({'src': "/image/help/image-detail-shot.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var multi_edit_screen_shot = IMG({'src': "/image/help/bulk-mode-screen.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Zoto allows you to organize your photos in a variety of different ways so that you can efficiently find and view them at later a date, or quickly share certain photos with others."),
				BR(),BR(),
				_("Additionally, your photos contain meta data written by your camera (EXIF) that allow us to display things like date taken, shutter speed, camera make and model, and more."),
				BR(),BR(),BR(),
				H5({}, _("multiple interfaces for organizing photos")),
				BR(),
				multi_edit_screen_shot,
				_("Zoto's primary means of organization is the lightbox, which supports viewing photos and provides a bulk-edit mode for taking actions on a set of photos."),
				BR(),BR(),
				_("The bulk edit mode is entered by clicking on the 'organizer' button.  When bulk mode is enabled, a series of buttons and controls will slide open above the thubnails in your account.  The thumbnails become 'selectable', and you can then apply different actions to them by clicking on the appropriate button."),
				BR({'clear': "all"}),
				BR(),
				single_edit_screen_shot,
				_("The lightbox also provides rapid-fire viewing of your photos by showing larger sized images when you click on a given thumbnail."),
				BR(),BR(),
				_("These 'image detail modals' allow you to edit basic information for a photo, and also allow you to label your photos with tags."),				
				BR({'clear': "all"}),
				BR()
			)
		);
	}
});
/*
* organizing by titles and description
*/
function zoto_organizing_td_item(options) {
        options = merge({'title': _("titles and descriptions")}, options);
        this.$uber(options);
}
extend(zoto_organizing_td_item, zoto_help_modal_item, {
	activate: function() {
		var single_edit_screen_shot = IMG({'src': "/image/help/single-edit-shot.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var multi_edit_screen_shot = IMG({'src': "/image/help/multi-edit-shot.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Photos on Zoto can have title and descriptions applied to them.  By default, a photo's title will be the filename of the photo when you upload it."),
				BR(),BR(),BR(),
				H5({}, _("editing titles and descriptions for single photos")),
				BR(),
				single_edit_screen_shot,
				_("To edit a single photo's title or description, you'll need to view the photo by clicking on one of the thumbnails on your pages."),
				BR(),BR(),
				_("Once the photo is displayed, hover over the title or description with your mouse, and click on the yellow highlighted text to open the text entry box."),
				BR(),BR(),
				_("For the title, just hit enter to save the new text.  To save the description, click on 'save'."),
				BR({'clear': "all"}),
				BR(),BR(),
				H5({}, _("editing titles and descriptions for multiple photos")),
				BR(),
				multi_edit_screen_shot,
				_("To edit multiple photos' title and description, click on the 'organizer' button in the lightbox.  A set of buttons will slide down, and the photos in the lightbox will become selectable."),
				BR(),BR(),
				_("Select any photos you want to label with a common title and description, then click on the 'edit text' button to bring up the 'edit photo details' modal."),
				BR({'clear': "all"}),
				BR(),
				_("Follow the instructions in the modal, then click on the 'save my changes' button when you are done."),
				BR()
			)
		);
	}
});
/*
* organizing - editing data taken
*/
function zoto_organizing_editing_item(options) {
        options = merge({'title': _("editing date taken")}, options);
	this.help_attribute = "HELP_ORGANIZE_EDITING";
        this.$uber(options);
}
extend(zoto_organizing_editing_item, zoto_help_modal_item, {
	activate: function() {
		var multi_edit_screen_shot = IMG({'src': "/image/help/multi-edit-date-shot.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({},
				_("Photos on Zoto can have dates applied to them.  By default, a photo's date will be the 'date taken' value that is extracted from its EXIF data."),
				BR(),BR(),BR(),
				H5({}, _("editing dates for single or multiple photos")),
				BR(),
				multi_edit_screen_shot,
				_("To edit one or more photo dates, click on the 'organizer' button in the lightbox."),
				BR(),BR(),
				_("Select one or more photos in the lightbox, then click on the 'edit date' button in the button bar.  A calendar modal will pop up and let you select a date to set on the photos."),
				BR(),BR(),
				_("When you are finished, click on the 'save date' button at the bottom."),
				BR({'clear': "all"}),
				BR(),BR(),
				_("Note: You can either type in the date and time using the text entry box, or you can use the calendar navigation to go to the correct date."),
				BR()
			)
		);
	}
});
/*
* organizing - setting privacy
*/
function zoto_organizing_privacy_item(options) {
        options = merge({'title': _("setting privacy")}, options);
        this.$uber(options);
}
extend(zoto_organizing_privacy_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var default_screen_shot = IMG({'src': "/image/help/default-perms-shot.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var bulk_screen_shot = IMG({'src': "/image/help/bulk-perms-shot.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		replaceChildNodes(this.content_el,
			DIV({},
				_("You can set the permissions for who can view/edit photos in your account.  Privacy settings for photos are set in two different locations on Zoto."),
				BR(),BR(),BR(),
				H5({}, _("default permissions")),
				BR(),
				default_screen_shot,
				_("Default permissions apply to all photos in your account.  Any old photos you have uploaded to your account, as well as new photos, will 'inherit' these default permissions - if they don't have individual permissions on them already."),
				BR(),BR(),
				_("To change these default permissions, click on 'settings' at the top left of any page, then click on 'photos' and 'permissions'.  You will need to use the pulldown to change the various level of permissions for a particular set of users."),
				BR({'clear': "all"}),
				BR(),
				H5({}, _("individual photo permissions")),
				BR(),
				bulk_screen_shot,
				_("Keep in mind individual permissions can be used to control access to specific photos.  Individual permissions 'override' default permissions."),
				BR(),BR(),
				_("You can even make certain photos public when the rest of your photos are private by default."),
				BR(),BR(),
				_("To 'remove' individual permissions from a given photo, use the 'leave permissions as is' radio button.  This will remove any specific permissions on the photo, and allow your default permissions to govern who has access to it."),
				BR({'clear': "all"})
			)
		);
	}
});
/*
* organizing tagging photos
*/
function zoto_organizing_tagging_item(options) {
        options = merge({'title': _("tagging photos")}, options);
        this.$uber(options);
}
extend(zoto_organizing_tagging_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var screen_shot = IMG({'src': "/image/help/tagging-shot.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var bulk_screen_shot = IMG({'src': "/image/help/bulk-tagging-shot.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		var need_more_help = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_TAGGING_OVERVIEW')"}, "help section devoted to tags");
		replaceChildNodes(this.content_el,
			DIV({},
				_("Zoto supports adding tags to your photos.  Tags are short amounts of text that help describe the photo.  Examples of good tags are 'dog', 'friend', 'thomas', 'trip', and 'cabo'.  There is a whole "),
				need_more_help,
				".",
				BR(),BR(),BR(),
				H5({}, _("individual photo tagging")),
				BR(),
				screen_shot,
				_("Individual photos can be tagged in either the image detail page, or the image detail modal, which appears when you click on a photo in the lightbox."),
				BR(),BR(),
				_("You can enter multiple tags by separating them with commas.  You can delete tags by clicking on the [x] next to the tag name."),
				BR({'clear': "all"}),
				BR(),
				H5({}, _("bulk tagging photos")),
				BR(),
				bulk_screen_shot,
				_("The bulk tagging modal will show you all tags on all the photos you select, as well as recently used tags."),
				BR(),BR(),
				_("You can enter new tags to the selected photos by using the text entry box, or by clicking on a tag in the lists.  You can delete tags by clicking on the [x] next to the common tag name."),
				BR({'clear': "all"})
			)
		);
	}
});
/*
* organizing - deleting
*/
function zoto_organizing_deleting_item(options) {
        options = merge({'title': _("deleting photos")}, options);
        this.$uber(options);
}
extend(zoto_organizing_deleting_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var screen_shot = IMG({'src': "/image/help/deleting-shot.png", 'style': "display: inline; float: right; margin-left: 6px;"});
		var bulk_screen_shot = IMG({'src': "/image/help/bulk-deleting-shot.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
		replaceChildNodes(this.content_el,
			DIV({},
				_("If you want to delete photos from your account, Zoto provides a couple of different ways to quickly remove them.  Please keep in mind that if you have blogged the photos, or used them on another website, the link to them will be broken after you delete them."),
				BR(),BR(),BR(),
				H5({}, _("individual photo deletion")),
				BR(),
				screen_shot,
				_("Individual photos can be deleted from the image detail page, by clicking on the 'delete' button below the photo."),
				BR(),BR(),
				_("Once you click on delete, an alert will popup confirming the deletion of the photo.  Clicking on 'ok' in that alert will instruct Zoto to delete the photo permanently.  Oh the humanity."),
				BR({'clear': "all"}),
				BR(),
				H5({}, _("bulk deleting photos")),
				BR(),
				bulk_screen_shot,
				_("You can delete multiple photos from your account by going into the lightbox organizer and clicking on the 'delete' button."),
				BR(),BR(),
				_("We'll pop up a confirmation dialog that will ask you again if you are sure you want to delete the selected photos.  Keep in mind that deleting a bunch of photos all at once can take a while."),
				BR({'clear': "all"})
			)
		);
	}
});
/*********************************************************
*					ALBUMS
*********************************************************/
function zoto_albums_menu(options) {
	this.$uber(options);
}

extend(zoto_albums_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* albums overview item
*/
function zoto_albums_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ALBUMS";
}
extend(zoto_albums_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var a_sets = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_ALBUM_SETS");'}, _("album sets"));
		var album_overview = IMG({'src': "/image/help/albums-overview.png", 'style': "display: inline; float: left; margin-right: 20px;"});
/*		
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
*/
		replaceChildNodes(this.content_el,
			DIV({}, _("Albums are great way to personalize and showcase your photos. Albums give you complete control of photo presentation. You can create an unlimited number of customizable albums. Go to the albums page by clicking on 'albums' in your navigation links next to your avatar in the top left of any page."),
			BR(), BR(),
			DIV({'style': "margin-left: auto, margin-right: auto;"}, album_overview, BR(), BR(), BR(), _("Zoto offers HTML and Flash albums which can be customized so you can create your perfect album.  HTML albums have border, background, and link colors options. You can also adjust image ordering and the number of image thumbnails displayed per page. Flash albums have layout, background, color, typeface, and image border customization options.")),
			BR({'clear': "all"}), BR(), BR(),
			_("In order to better help you keep your albums organized we've created "),  a_sets, _(". These allow you to group any number of albums into a specific category that you create. For instance, several albums of your children might go in a 'family' set. You can associate your albums with as many sets as you like.")
			)
		);

	}
});
/*
* albums creating an album item
*/
function zoto_albums_creating_item(options) {
        options = merge({'title': _("creating an album")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ALBUMS_CREATE";
	this.a_album_add_images = A({'href': "javascript:currentDocument().help_modal.show_context('ALBUMS_ADD_PHOTOS');"}, _("add images to your album"));
	this.a_this_is_gay = A({'href': "javascript:currentDocument().help_modal.show_context('ALBUMS_ADD_PHOTOS');"}, _("add images to your album"));
}
extend(zoto_albums_creating_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var new_album_button = IMG({'src': "/image/help/newalbum-button.png", 'style': "display: inline; float: left; margin-right: 6px;"});
		var album_typetitle = IMG({'src': "/image/help/album-typetitle.png", 'style': "display: inline; float: left; align:top;"});
		var new_album_bulk_mode = IMG({'src': "/image/help/newalbum-bulkmode.png", 'style': "display: inline; float: left; margin-right: 15px;"});
		var a_lightbox = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_ORGANIZE_OVERVIEW");'}, _("lightbox organizer"));
/*
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
*/
		replaceChildNodes(this.content_el,
			DIV({}, _("There are two ways to create an album. You can create an empty album to add photos to it later or you can select a group of photos from your lightbox organizer and create an album with those selected photos on the fly."),
			BR(), BR(),
			H5({}, _("creating an empty album")),
			BR(),
			new_album_button,
			DIV({'style': "float:left;"},BR(), _("Click the 'new album' button from your albums page.")),
			BR({'clear': "all"}),
			DIV({'style': "float: left"},BR(), _("Enter a title and description for this album in the resulting pop up modal. Click 'save and close'")),
			BR({'clear':"all"}),
			DIV({'style':"align: top"}, album_typetitle),
			BR({'clear':"all"}),
			DIV({},_("Now you're ready to "), this.a_this_is_gay, "."), 
			BR({'clear':"all"}), BR(),
			H5({}, _("creating a new album 'on the fly'")),
			BR(), BR(),
			new_album_bulk_mode,
			DIV({'style': "float:left; width: 200px;"},_("From your "), a_lightbox, _(" you can create an album just by selecting a bunch of photos that will go into it. Then click 'add/edit album(s)'.")),
			BR({'clear':"all"}), BR(), BR(),
			_("A double paned modal will give you the option to create a new album for these selected photos OR you can add them to an existing album. If you are creating a new album for the selected photos you will be taken through a series of album creation modals. If the album already exists you can just "), 
			this.a_album_add_images, "."
			)
		);
	}
});
/*
* albums adding photos item
*/
function zoto_albums_adding_photos_item(options) {
        options = merge({'title': _("adding photos")}, options);
        this.$uber(options);
	this.help_attribute = "ALBUMS_ADD_PHOTOS";
}
extend(zoto_albums_adding_photos_item, zoto_help_modal_item, {
	activate: function() {
		// var empty_album_add_photos = IMG({'src': "/image/help/empty_album_add_photos.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var album_chooser = IMG({'src': "/image/help/arrangephotos-new.png"});
		var album_add_selected = IMG({'src': "/image/help/albums-addselected.png"});
		var album_add_images_lightbox  = IMG({'src': "/image/help/albums-bulkmodal.png", 'style': "display: inline; float: right; margin-right: 15px; margin-bottom: 10px;"});
		var a_lightbox = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_ORGANIZE_OVERVIEW");'}, _("lightbox organizer"));
		var album_addimages  = IMG({'src': "/image/help/albums-addimages.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var album_bulkcreate  = IMG({'src': "/image/help/albums-bulkcreatealbum.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});

		swapElementClass(this.link, 'item_not_active', 'item_active');
/*
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
*/
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("Adding photos to your album(s) is easy. You have two methods for adding photos to albums."),
				BR(),
				BR(),
				H5("adding photos to albums from albums page"),
				BR(),
				album_addimages,
				_("Click on 'edit' underneath your album. In the pop up submenu, click 'add/remove' photos."),
				_("The image chooser will appear. Use the image chooser to select the photos you want in this album. Click 'add selected'"),
				BR({'clear': "all"}),
				BR(),
							
				H5("adding photos to albums from lightbox organizer"),
				BR(),
				
				album_bulkcreate,
				_("From withing the lightbox click on the organizer button, select photos, and then click the 'add/edit albums' button."),
				
				BR({'clear': "all"}),
				BR(),
				album_add_images_lightbox, 
				_("After selecting photos from the "), 
				a_lightbox, 
				_(" you can either click the 'create new album' button to add your photos to a new album or you can choose to add your photos to any of your existing albums. The left pane of the modal will display all of your existing albums. Just highlight the appropriate album then click the arrow to apply. You can remove an album associated with your selected images by removing them from the right panel.")
			)
		);
	}
});
/*
* albums reordering photos item
*/
function zoto_albums_reorder_item(options) {
        options = merge({'title': _("reorder photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ALBUMS_REORDER";
}
extend(zoto_albums_reorder_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var album_arrange_modal = IMG({'src': "/image/help/arrange-smodal.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var album_arrange_menu = IMG({'src': "/image/help/arrange-menu.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		//replaceChildNodes(this.content_el,
		//_("Help section coming soon.")
		//);
		replaceChildNodes(this.content_el,
			DIV({}, 
			_("You can reorder the photos in your album through a drag and drop interface."),
			BR({'clear':"all"}),
			BR(), 
			album_arrange_menu,	
			_("From your albums page, click the 'edit' link that appears underneath your album. Click 'arrange photos'. A modal will appear containing the thumbnails of the the photos in your album."), 
			
			
			BR({'clear':"all"}),
			BR(), 
			_("Drag and drop photos to rearrange them. When you are finished save your changes and close the modal window."),
			BR(),
			BR(),
			album_arrange_modal
			)
		);
	}
});
/*
* albums album sets item
*/
function zoto_albums_album_sets_item(options) {
        options = merge({'title': _("album sets")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ALBUM_SETS";
}
extend(zoto_albums_album_sets_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var sets_lightbox = IMG({'src': "/image/help/sets-1.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var sets_btn = IMG({'src': "/image/help/set-editbtn.png", 'style': "display: inline; float: right; margin-right: 15px; margin-bottom: 10px;"});
		var sets_edit = IMG({'src': "/image/help/sets-editmodal.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
		replaceChildNodes(this.content_el,
			DIV({}, 
			_("Album sets help you keep your albums organized. These allow you to group any number of albums into a specific category that you create. For instance, the galleries 'mom', 'cousins', 'reunion' could go into a 'family' set. You may associate your albums with as many sets as you like.")),
			BR(),
			sets_lightbox,	
			BR({'clear':"all"}), BR(),
			H5({}, _("creating and managing sets")),
			BR(),
			sets_btn,
			_("From your albums page, click the 'edit album sets' button. The edit sets modal lists all of your existing sets and has a form to create a new set. From this modal you also have the option to add, remove, and delete albums assosciated with your sets. "),
			BR(), BR(), BR(),
			sets_edit
		);
	}
});
/*
* albums changing templates item
*/
function zoto_albums_changing_templates_item(options) {
        options = merge({'title': _("changing templates")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_ALBUMS_CHANGING_TEMPLATES";
}
extend(zoto_albums_changing_templates_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var sets_template = IMG({'src': "/image/help/template-options2.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		replaceChildNodes(this.content_el,
			DIV({}, 
			
			
			_("Zoto gives you options for controlling the display of your albums. From your albums page, click 'edit' under the album you want to change. Click 'template options' from the pop up menu. A modal will appear to display the customizable options available for the template you have chosen. HTML and flash customization options vary slightly."),
			BR(),BR(),
			_("1. Choose a layout (HTML or one of several Flash layouts)"),
			BR(),
			_("2. Click the 'customize this album' button at the bottom of the modal"),
			BR(),
			_("3. Adjust your background, typeface, photo borders, and link colors until you are satisfied"),
			BR(),
			_("4. When you are done click 'save and close'"),
			BR(),BR()),
			sets_template
		);
	}
});
/*********************************************************
*					TAGGING
*********************************************************/
function zoto_tagging_menu(options) {
	this.$uber(options);
}

extend(zoto_tagging_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* tagging - overvew
*/
function zoto_tagging_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TAGGING_OVERVIEW";
}
extend(zoto_tagging_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var tag_example = IMG({'src': "/image/help/tag-cloud.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		replaceChildNodes(this.content_el,

		_("Tagging simply a means adding information to your photos, and it's useful for finding photos later when you need them. While putting titles, descriptions, and comments on your photos is good for describing a few photos, tagging allows you to put more relevant information on them in a shorter amount of time."),
		BR(), BR(),
		_("Zoto displays your tags on your homepage in a 'widget' which you can add or remove.  Your tags are also viewable in the lightbox.  Tags are displayed in a 'cloud' view which allows you to glance at your tags and know which tags have the most photos associated with them.  Tags that appear larger than other tags have a greater number of photos assocated with them."),
		BR(),BR(),
			tag_example	
			
		);

	}
});
/*
* tagging - add and remove
*/
function zoto_tagging_add_remove_item(options) {
        options = merge({'title': _("add and remove")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TAGGING_ADD_REMOVE";
}
extend(zoto_tagging_add_remove_item, zoto_help_modal_item, {
	activate: function() {
		var a_bulk_mode = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_TAGGING_BULK");'}, _("bulk tagging"));
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var tag_addsingle = IMG({'src': "/image/help/tag-adding.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var tag_detail = IMG({'src': "/image/help/tagging-shot.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		replaceChildNodes(this.content_el,
			_("You can add a tag to an individual photo using the add tag option on the image modal or on the image detail page. "),
		 
			BR({'clear':"all"}),
			tag_detail,
			BR({'clear':"all"}),
			
			_(" Enter the tag (a descriptive keyword) and click the 'add' button or hit enter. Existing tags are displayed as links beneath this field. "),
			BR({'clear':"all"}),
			
			tag_addsingle,
			BR({'clear':"all"}),
			
			
				
			_("Clicking the [X] next to the tag will remove it. Remove tags you have placed on your photo or tags other's have placed on your photo."),
			_(" Enter multiple tags on one line by separating them with commas.")
			
				
		);

	}
});
/*
* tagging - bulk mode
*/
function zoto_tagging_bulk_mode_item(options) {
        options = merge({'title': _("bulk mode")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TAGGING_BULK";
}
extend(zoto_tagging_bulk_mode_item, zoto_help_modal_item, {
	activate: function() {
		var a_lightbox = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_ORGANIZE_OVERVIEW");'}, _("lightbox organizer"));
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var tag_bulk = IMG({'src': "/image/help/tagging-bulkmodal.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		replaceChildNodes(this.content_el,
			DIV({}, _("Bulk tagging, as with most bulk editing, is done in the "), a_lightbox, "."),
			BR(),
			tag_bulk,
			
			BR({'clear':"all"}),
			_("From your lightbox page, open your organizer. Select all of the images you want to tag and click 'edit tags'. Enter tags in the field provided then click 'add' or just hit enter. When tagging is complete click 'done'.")
			
		);

	}
});
/*
* tagging - management
*/
function zoto_tagging_management_item(options) {
        options = merge({'title': _("management")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TAGGING_MANAGEMENT";
}
extend(zoto_tagging_management_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var tag_edit = IMG({'src': "/image/help/tag-editmode.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var tag_toggle = IMG({'src': "/image/help/tagedit-toggle.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		replaceChildNodes(this.content_el,
			DIV({}, _("Visit your tags home page to view all of your tags. Select how many tags you would like to view on the page and the type of order you would like them sorted by. Click the 'organizer' button to start 'edit' mode for your tags. This button works as a toggle just like it does in the photos lightbox. You can click directly into the text of a tag to edit or click the [x] to delete the tag entirely. When you are done just click the 'organizer' button again to return to normal viewing mode. ")),
			BR(), 
			tag_edit,
			BR({'clear':"all"}),
			_("You can view tags as a flat list or a cloud view from this page. In cloud view, tag size correlates to the number of photos associated with a tag."),
			BR({'clear':"all"}),
				tag_toggle
			
			
		);

	}
});
/*********************************************************
*					PUBLISHING AND SHARING
*********************************************************/
function zoto_publish_share_menu(options) {
	this.$uber(options);
}

extend(zoto_publish_share_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* publish share - overview
*/

function zoto_publish_share_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_PUBLISH_SHARE_OVERVIEW";
}
extend(zoto_publish_share_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var tag_edit = IMG({'src': "/image/help/tag-editmode.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		
		replaceChildNodes(this.content_el,
			DIV({}, _("Zoto offers a variety of ways to share your photos including:")),
			 BR(),
			
				_("Emailing photos and albums"), 
				BR(),
				_("blogging photos"), 
				BR(),
				_("RSS feeds"), 
				BR(),
				_("Publishing photos to Flickr"),
					BR(),BR(),
				_("We also have plans to introduce groups so that you can share your photos with the Zoto community.")
			
		);
	}
});
/*
* publish share - email photos
*/

function zoto_publish_share_email_item(options) {
        options = merge({'title': _("emailing photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_PUBLISH_SHARE_EMAIL";
}
extend(zoto_publish_share_email_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var email_photos = IMG({'src': "/image/help/email-photos.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var share_link = IMG({'src': "/image/help/share-album.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		replaceChildNodes(this.content_el,
			("Emailing multiple photos or an individual photo is easy. You can email multiple photos as once by selecting the organizer button in the photo lightbox, choosing your photos, and then clicking on the email button. An email modal will appear. You can email an individual photo by navigating to the image detail page and clicking the 'email' button underneath the photo.."),
			BR(), BR(),
			email_photos,
			BR({'clear':"all"}),
			"You can email albums in the same manner. Either select multiple albums from within the album lightbox or click the 'share' link next to an album to launch the email modal.",
				BR({'clear':"all"}),
				share_link
		);
	}
});
/*
* publish share - blog
*/

function zoto_publish_share_blog_item(options) {
        options = merge({'title': _("blogging photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_PUBLISH_SHARE_BLOG";
}
extend(zoto_publish_share_blog_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var publish_modal = IMG({'src': "/image/help/publish-photos.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var publish_photos = IMG({'src': "/image/help/publish-photosbutton.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var a_lightbox = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_ORGANIZE_OVERVIEW");'}, _("lightbox organizer"));
		
		replaceChildNodes(this.content_el,
			_("Publishing photos to a blog is a bulk process done from the "), a_lightbox, (" page. Click the 'organizer' button and select the images you want to publish then click 'publish photo(s)'."),
		BR({'clear':"all"}),
			publish_photos,
			BR({'clear':"all"}),
			_("This launches the 'publish photos' modal. This modal will show any existing blogs that zoto is aware of. To add a blog, click the appropriate buttons and follow the onscreen instructions. Bear in mind, this process DOES NOT CREATE A BLOG ACCOUNT. You must set those up the respective websites. This process establishes a communication between zoto and your blog account only."),
		
			publish_modal
			
			
		);
	}
});
/*
* publish share - flickr
*/

function zoto_publish_share_flickr_item(options) {
        options = merge({'title': _("send to flickr")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_PUBLISH_SHARE_FLICKR";
}
extend(zoto_publish_share_flickr_item, zoto_help_modal_item, {
	activate: function() {
		var a_lightbox = A({'href': 'javascript:currentDocument().help_modal.show_context("HELP_ORGANIZE_OVERVIEW");'}, _("lightbox organizer"));
		swapElementClass(this.link, 'item_not_active', 'item_active');
		
		var publish_flickr = IMG({'src': "/image/help/publishtoflickr-modal.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var organizer_view = IMG({'src': "/image/help/organizer-open.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
		replaceChildNodes(this.content_el,
			_("Publishing photos to a Flickr account is a bulk process done from the "), a_lightbox, (" page. Click the 'organizer' button and select the images you want to publish then click 'publish photo(s)'."),
			BR(),  
			BR({'clear':"all"}),
			organizer_view,
			BR({'clear':"all"}),
			BR(), 
			_("This launches the 'publish photos' modal. This modal will show any existing Flickr accounts that zoto is aware of. To add a Flickr account, click the appropriate buttons and follow the onscreen instructions. Bear in mind, this process DOES NOT CREATE A FLICKR ACCOUNT. You must set those up at www.flickr.com. This process establishes a communication between zoto and your Flickr account only."),
			BR(), BR(),
			publish_flickr,
		BR({'clear':"all"}),
			
			_("Once you allow our software to talk to your Flickr account, synching your photos with Flickr is a stomach tingling click away. ")
			
			
			
		);
	}
});
/*********************************************************
*					 CONTACTS
*********************************************************/
function zoto_contacts_menu(options) {
	this.$uber(options);
}

extend(zoto_contacts_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* contacts - overview item
*/
function zoto_contacts_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_CONTACTS_OVERVIEW";
}
extend(zoto_contacts_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
	
	var contacts_capture = IMG({'src': "/image/help/contacts-capture.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
	
	
		replaceChildNodes(this.content_el,
			DIV({}, _("Zoto has developed a robust system for maintaining your contacts. This system allows you to 'batch' approve contact requests without having to manually approve them each time. But you don't have to. You can also create contact groups to keep your contacts better organized. Contacts are searchable by username, email addres (if it's public), and location.")),
			BR(), BR(),
			contacts_capture
			
		);
	}
});
/*
* contacts - add and remove item
*/
function zoto_contacts_add_remove_item(options) {
        options = merge({'title': _("add and remove")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_CONTACTS_ADD_REMOVE";
}
extend(zoto_contacts_add_remove_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		
		var add_user = IMG({'src': "/image/help/contact-adduser.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var search_user = IMG({'src': "/image/help/contacts-addmodal.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		
		replaceChildNodes(this.content_el,
			_("You can add a zoto user as a contact 2 ways."),
			BR(),BR(),
			_("Clicking on the contacts link in the menu underneath their username and adding them as a contact."),
			BR(), BR(),
			add_user,
			BR({'clear':"all"}), BR(),
			_("Going to the contact's lightbox and clicking the 'add contact button'. You can search for and add the user to your contacts. Some users will require that they approve your contact request. By default this option is disabled. Once a contact is added to your contact list they will appear in your contact's lightbox. To remove them as a contact click 'delete'."),
			BR(), BR(),
			search_user,
			BR({'clear':"all"}), BR()
			
		);
	}
});
/*
* contacts - lists  item
*/
function zoto_contacts_lists_item(options) {
        options = merge({'title': _("contact lists")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_CONTACTS_LISTS";
}
extend(zoto_contacts_lists_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		
		var edit_lists = IMG({'src': "/image/help/contact-editlists.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
	
		replaceChildNodes(this.content_el,
			_("Contact lists are used to help you organize your contacts into groups that make sense to you. You are not required to have contact lists but if you have many contacts it will be helpful."), 
			BR(), BR(),
			_("To create contact lists, click the 'edit lists' button in the contacts lightbox"),
			BR(), BR(),
			edit_lists


		);
	}
});
/*
* contacts - privacy item
*/
function zoto_contacts_privacy_item(options) {
        options = merge({'title': _("using for privacy")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_CONTACTS_PRIVACY";
}
extend(zoto_contacts_privacy_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		
		var privacy_modal = IMG({'src': "/image/help/contacts-permissions.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		var privacy_bulk = IMG({'src': "/image/help/bulk-privacy.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
		replaceChildNodes(this.content_el,
			_("Contact lists are useful to restrict access to certain photos to a group of people. Just click on a photo or multiple photos in the photos lightbox and select 'privacy settings'."),
			BR(), 
			BR({'clear':"all"}),
			privacy_bulk,
			BR({'clear':"all"}),
			_(" The privacy modal will appear. You can restrict or give access to certain contacts or all of your contact lists. When you are done, save your settings."),
			BR({'clear':"all"}),
			privacy_modal
		);
	}
});
/*
* contacts - settings item
*/
function zoto_contacts_settings_item(options) {
        options = merge({'title': _("settings")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_CONTACTS_SETTINGS";
}
extend(zoto_contacts_settings_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		
		var privacy_bulk = IMG({'src': "/image/help/settings_contacts.png", 'style': "display: inline; float: left; margin-right: 15px; margin-bottom: 10px;"});
		
		replaceChildNodes(this.content_el,
			_("You can adjust your contact settings in the settings modal. Open the settings modal by clicking 'settings' in the top right corner of any page. In the settings modal click 'account info', then 'profile settings' on the left side of the modal. See 'allow users to add me as a contact at the bottom."),
			BR(), BR(),
			privacy_bulk
		
			
			
		);
	}
});
/*
* contacts - futute support item
*/
function zoto_contacts_support_item(options) {
        options = merge({'title': _("future support")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_CONTACTS_SUPPORT";
}
extend(zoto_contacts_support_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			_("Help section coming soon.")
		);
		replaceChildNodes(this.content_el,
			DIV({}, _("In the future we will read images from your thoughts. Then call the cops."))
		);
	}
});
/*********************************************************
*					ALL VIDEO TUTORIALS
*********************************************************/
function zoto_tutorials_menu(options) {
	this.$uber(options);
}

extend(zoto_tutorials_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/*
* video tutorials - overview
*/
function zoto_tutorials_overview_item(options) {
        options = merge({'title': _("overview")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_OVERVIEW";
}
extend(zoto_tutorials_overview_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		var forum_post_link = A({'href':"http://forum." + zoto_domain + "/"}, _("post a request in our forums."));
		var install_uploader = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_TUTORIALS_INSTALL_UPLOADER')"}, _("installing the uploader tutorial "));
		var using_uploader = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_TUTORIALS_USE_UPLOADER')"}, _("using the uploader client tutorial "));
		replaceChildNodes(this.content_el,
			DIV({}, 
				_("While we've designed Zoto to be super easy to use, we still thought it would be helpful to have a set of video tutorials that will guide you through the various features on the site."),
				BR(),BR(),
				_("These tutorials are done in Flash, so you'll need to have it installed to see the videos.  If you don't have Flash installed, you can download it over at Adobe's website."),
				BR(),BR(),
				_("We will be adding more tutorials as time allows over the next few months.  If you want to request a particular tutorial to be produced, simply "),
				forum_post_link,
				BR(),BR(),BR(),
				H5({}, _("available video tutorials")),
				UL({},
					LI({'style': 'list-style: disc;'}, install_uploader),
					LI({'style': 'list-style: disc;'}, using_uploader)
				)
			)
		);
	}
});
/*
* video tutorials - installing the uploader
*/
function zoto_tutorials_install_uploader_item(options) {
	options = merge({'title': _("install the uploader")}, options);
	this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_INSTALL_UPLOADER";
	this.flash_window = DIV({'style':'position: absolute; z-index: 0; width: 540px; height: 480px;'});
	this.win_ff = A({'href':"javascript:void(0)"}, _("Firefox on Windows"));
	connect(this.win_ff, 'onclick', this, 'show_install_tutorial_win_ff');
	this.win_ie = A({'href':"javascript:void(0)"}, _("Internet Explorer on Windows"));
	connect(this.win_ie, 'onclick', this, 'show_install_tutorial_win_ie');
	this.win_opera = A({'href':"javascript:void(0)"}, _("Opera 9.x on Windows"));
	connect(this.win_opera, 'onclick', this, 'show_install_tutorial_win_opera');
	this.osx_ff = A({'href':"javascript:void(0)"}, _("Firefox on OSX"));
	connect(this.osx_ff, 'onclick', this, 'show_install_tutorial_osx_ff');
	this.osx_safari = A({'href':"javascript:void(0)"}, _("Safari on OSX"));
	connect(this.osx_safari, 'onclick', this, 'show_install_tutorial_osx_safari');
	this.install_uploader = A({'href':"javascript:currentDocument().help_modal.show_context('HELP_TUTORIALS_INSTALL_UPLOADER')"}, _("other videos"));
	this.adobe_link = A({'href':"http://www.adobe.com/products/flashplayer/"}, _("Adobe's website"));
}
extend(zoto_tutorials_install_uploader_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');

		replaceChildNodes(this.content_el, 
			DIV({},
				this.flash_window
			)
		);
	
		if (zoto_detect.supportsFlash() == false) {
			replaceChildNodes(this.flash_window,
				DIV({},
					H5({}, _("whoa there partner - you don't have flash installed!")),
					BR(),
					_("Zoto's site doesn't use a lot of Flash, so you are just peachy continuing to use the site without it.  You do need to know that you can't watch our cool tutorials, or upload via the web however."),
					BR(),BR(),
					_("If you want to install Flash for your computer, just head on over to "),
					this.adobe_link,
					_(" and download it now.")
				)
			);
		} else if (zoto_detect.getFlashVersion() < 8){
			replaceChildNodes(this.flash_window,
				DIV({},
					H5({}, _("whoa there partner - you've got a dusty version of flash installed!")),
					BR(),
					_("Zoto's site doesn't use a lot of Flash, so you are just peachy continuing to use the site without it.  You do need to know that you can't watch our cool tutorials, or upload via the web however."),
					BR(),BR(),
					_("If you want to install Flash for your computer, just head on over to "),
					this.adobe_link,
					_(" and download it now.")

				)
			);
		}  else {
			this.show_install_tutorial_list();
		}
	},
	show_install_tutorial_list: function() {
		var tutorial_list = DIV({},
			_("The following videos are available for installing the uploader client.  Choose the video that is appropriate for your particular browser and operating system."),
			BR(),
			UL({},
				LI({'style': 'list-style: disc;'}, this.win_ff),
				LI({'style': 'list-style: disc;'}, this.win_ie),
				LI({'style': 'list-style: disc;'}, this.win_opera),
				LI({'style': 'list-style: disc;'}, this.osx_ff),
				LI({'style': 'list-style: disc;'}, this.osx_safari)
			)
		);
		if(zoto_detect.isLinux()) {
			linux_blurb = DIV({},
				H5({}, _("linux installation")),
				BR(),
				_("So yeah, you hardcore Linux users don't get a video for installing the uploader because you have to compile it yourself.  However, you can still view the videos for other operating systems below."),
				BR(),BR(),
				_("To build the client from source, you will need to refer the to README document included in the tarball that is available for download."),
				BR(),BR(),
				tutorial_list
			)
			replaceChildNodes(this.flash_window, linux_blurb);
		} else {
			replaceChildNodes(this.flash_window, tutorial_list);
		}
	},
	show_install_tutorial_win_ff: function() {
		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 540px; height: 480px;'});
		var so = new SWFObject("/download/tutorial/player.swf?win_ff_install.flv", "tutorial_download", "540", "480", "8", "#ffffff");
		so.addParam("quality", "high");
		so.addParam("wmode", "transparent");
		so.addParam("menu", "false");
		so.addParam("allowScriptAccess", "sameDomain");
		flash_object.innerHTML = so.getSWFHTML();

		var content = DIV({},
			_("The following video is for installing the uploader client from Firefox in Windows.  You can also view the "),
			this.install_uploader,
			"."
		);
		replaceChildNodes(this.flash_window, content);
		appendChildNodes(this.flash_window, flash_object);
	},
	show_install_tutorial_win_ie: function() {
		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 540px; height: 480px;'});
		var so = new SWFObject("/download/tutorial/player.swf?win_ie_install.flv", "tutorial_download", "540", "480", "8", "#ffffff");
		so.addParam("quality", "high");
		so.addParam("wmode", "transparent");
		so.addParam("menu", "false");
		so.addParam("allowScriptAccess", "sameDomain");
		flash_object.innerHTML = so.getSWFHTML();

		var content = DIV({},
			_("The following video is for installing the uploader client from Internet Explorer in Windows.  You can also view the "),
			this.install_uploader,
			"."
		);
		replaceChildNodes(this.flash_window, content);
		appendChildNodes(this.flash_window, flash_object);
	},
	show_install_tutorial_win_opera: function() {
		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 540px; height: 480px;'});
		var so = new SWFObject("/download/tutorial/player.swf?win_op_install.flv", "tutorial_download", "540", "480", "8", "#ffffff");
		so.addParam("quality", "high");
		so.addParam("wmode", "transparent");
		so.addParam("menu", "false");
		so.addParam("allowScriptAccess", "sameDomain");
		flash_object.innerHTML = so.getSWFHTML();

		var content = DIV({},
			_("The following video is for installing the uploader client from Opera in Windows.  You can also view the "),
			this.install_uploader,
			"."
		);
		replaceChildNodes(this.flash_window, content);
		appendChildNodes(this.flash_window, flash_object);
	},
	show_install_tutorial_osx_ff: function() {
		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 540px; height: 480px;'});
		var so = new SWFObject("/download/tutorial/player.swf?mac_ff_install.flv", "tutorial_download", "540", "480", "8", "#ffffff");
		so.addParam("quality", "high");
		so.addParam("wmode", "transparent");
		so.addParam("menu", "false");
		so.addParam("allowScriptAccess", "sameDomain");
		flash_object.innerHTML = so.getSWFHTML();

		var content = DIV({},
			_("The following video is for installing the uploader client from Firefox in Apple's OSX.  You can also view the "),
			this.install_uploader,
			"."
		);
		replaceChildNodes(this.flash_window, content);
		appendChildNodes(this.flash_window, flash_object);
	},
	show_install_tutorial_osx_safari: function() {
		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 540px; height: 480px;'});
		var so = new SWFObject("/download/tutorial/player.swf?mac_saf_install.flv", "tutorial_download", "540", "480", "8", "#ffffff");
		so.addParam("quality", "high");
		so.addParam("wmode", "transparent");
		so.addParam("menu", "false");
		so.addParam("allowScriptAccess", "sameDomain");
		flash_object.innerHTML = so.getSWFHTML();

		var content = DIV({},
			_("The following video is for installing the uploader client from Safari in Apple's OSX.  You can also view the "),
			this.install_uploader,
			"."
		);
		replaceChildNodes(this.flash_window, content);
		appendChildNodes(this.flash_window, flash_object);
	}
});
/*
* video tutorials - using uploader
*/
function zoto_tutorials_use_uploader_item(options) {
        options = merge({'title': _("using the uploader")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_USE_UPLOADER";
}
extend(zoto_tutorials_use_uploader_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - organize photos
*/
function zoto_tutorials_organize_photos_item(options) {
        options = merge({'title': _("organizing photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_ORGANIZING";
}
extend(zoto_tutorials_organize_photos_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - setting privacy
*/
function zoto_tutorials_privacy_item(options) {
        options = merge({'title': _("setting privacy")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_PRIVACY";
}
extend(zoto_tutorials_privacy_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - tagging photos
*/
function zoto_tutorials_tagging_photos_item(options) {
        options = merge({'title': _("tagging photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_TAGGING_PHOTOS";
}
extend(zoto_tutorials_tagging_photos_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - using the lightbox
*/
function zoto_tutorials_lightbox_item(options) {
        options = merge({'title': _("using the lightbox")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_lightbox";
}
extend(zoto_tutorials_lightbox_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - viewing photos
*/
function zoto_tutorials_viewing_photos_item(options) {
        options = merge({'title': _("viewing photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_VIEWING_PHOTOS";
}
extend(zoto_tutorials_viewing_photos_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - publishing photos
*/
function zoto_tutorials_publishing_photos_item(options) {
        options = merge({'title': _("publishing photos")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_PUBLISHING_PHOTOS";
}
extend(zoto_tutorials_publishing_photos_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*
* video tutorials - using contacts
*/
function zoto_tutorials_using_contacts_item(options) {
        options = merge({'title': _("using contacts")}, options);
        this.$uber(options);
	this.help_attribute = "HELP_TUTORIALS_USING_CONTACTS";
}
extend(zoto_tutorials_using_contacts_item, zoto_help_modal_item, {
	activate: function() {
		swapElementClass(this.link, 'item_not_active', 'item_active');
		replaceChildNodes(this.content_el,
			DIV({}, _("This help section coming soon."))
		);
	}
});
/*********************************************************
*					MAIN MENU
*********************************************************/
function zoto_main_menu(options) {
	this.$uber(options);
	/* if you want to make a link that opens another menu here's how to do it
	this.tutorials_menu = A({'href':'javascript:void(0);'}, _("tutorial videos"));
	connect(this.tutorials_menu, 'onclick', function(){
		currentDocument().help_modal.show_context("UPLOADER_VIDEO")
		}); 
	replaceChildNodes(this.content_el,
		DIV({}, _("Welcome to Zoto help. We've designed a series of "), this.tutorials_menu,  _(" to help you learn how to take full advantage of features so that you can get more out of your photos."))
	);
	*/
}
extend(zoto_main_menu, zoto_help_modal_menu, {
	activate: function() {
	}
});
/********************************************************
* Main help modal
**********************************************************/
function zoto_help_modal(options) {
	this.$uber(options);
	this.initialized = false;
}

extend(zoto_help_modal, zoto_modal_window, {
	initialize: function(context) {
		this.main_menu = new zoto_main_menu({'menu_level': -1, 'title': "MAIN HELP"});
		connect(this.main_menu, "SHOW_ITEM", this, 'show_item');
		//zoto overview
		this.overview_menu = new zoto_overview_menu({'title': _("zoto overview"), 'menu_level': 0});
		this.overview_menu.add_item(new zoto_about_item({}));
		this.overview_menu.add_item(new zoto_features_item({}));
		this.overview_menu.add_item(new zoto_language_item({}));
		this.overview_menu.add_item(new zoto_terms_item({}));
		this.overview_menu.add_item(new zoto_privacy_item({}));
		this.overview_menu.add_item(new zoto_contact_item({}));
		this.overview_menu.add_item(new zoto_crew_item({}));
		this.main_menu.add_menu(this.overview_menu);
		//uploading photos menu
		this.uploading_menu = new zoto_uploading_menu({'title': _("uploading photos"), 'menu_level': 0});
		this.uploading_menu.add_item(new zoto_uploading_overview_item({}));
		this.uploading_menu.add_item(new zoto_install_item({}));
		this.uploading_menu.add_item(new zoto_uploading_item({}));
		this.uploading_menu.add_item(new zoto_web_uploading_item({}));
		this.uploading_menu.add_item(new zoto_supported_files_item({}));
		this.uploading_menu.add_item(new zoto_uploading_future_support_item({}));
		this.main_menu.add_menu(this.uploading_menu);
		//customizing your account
		this.account_menu = new zoto_account_menu({'title': _("your account"), 'menu_level': 0});
		this.account_menu.add_item(new zoto_account_overview_item({}));
		this.account_menu.add_item(new zoto_account_homepage_item({}));
		this.account_menu.add_item(new zoto_account_profile_item({}));
		this.account_menu.add_item(new zoto_account_avatar_item({}));
		this.account_menu.add_item(new zoto_account_messaging_item({}));
		this.main_menu.add_menu(this.account_menu);
		//organizing photos
		this.organizing_photos_menu = new zoto_organizing_menu({'title': _("organizing photos"), 'menu_level': 0});
		this.organizing_photos_menu.add_item(new zoto_organizing_overview_item({}));
		this.organizing_photos_menu.add_item(new zoto_organizing_td_item({}));
		this.organizing_photos_menu.add_item(new zoto_organizing_editing_item({}));
		this.organizing_photos_menu.add_item(new zoto_organizing_privacy_item({}));
		this.organizing_photos_menu.add_item(new zoto_organizing_tagging_item({}));
		this.organizing_photos_menu.add_item(new zoto_organizing_deleting_item({}));
		this.main_menu.add_menu(this.organizing_photos_menu);
		//viewing photos
		this.viewing_photos_menu = new zoto_viewing_photos_menu({'title': _("viewing photos"), 'menu_level': 0});
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_overview_item({}));
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_lightbox_item({}));
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_photo_modals_item({}));
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_image_detail_item({}));
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_exif_item({}));
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_searching_item({}));
		this.viewing_photos_menu.add_item(new zoto_viewing_photos_other_sizes_item({}));
		this.main_menu.add_menu(this.viewing_photos_menu);
		//albums
		this.albums_menu = new zoto_albums_menu({'title': _("photo albums"), 'menu_level': 0});
		this.albums_menu.add_item(new zoto_albums_overview_item({}));
		this.albums_menu.add_item(new zoto_albums_creating_item({}));
		this.albums_menu.add_item(new zoto_albums_adding_photos_item({}));
		this.albums_menu.add_item(new zoto_albums_reorder_item({}));
		this.albums_menu.add_item(new zoto_albums_album_sets_item({}));
		this.albums_menu.add_item(new zoto_albums_changing_templates_item({}));
		this.main_menu.add_menu(this.albums_menu);
		//tagging
		this.tagging_menu = new zoto_tagging_menu({'title': _("tagging photos"), 'menu_level': 0});
		this.tagging_menu.add_item(new zoto_tagging_overview_item({}));
		this.tagging_menu.add_item(new zoto_tagging_add_remove_item({}));
		this.tagging_menu.add_item(new zoto_tagging_bulk_mode_item({}));
		this.tagging_menu.add_item(new zoto_tagging_management_item({}));
		this.main_menu.add_menu(this.tagging_menu);
		this.publish_share_menu = new zoto_publish_share_menu({'title': _("publish & share"), 'menu_level':0});
		this.publish_share_menu.add_item(new zoto_publish_share_overview_item({}));
		this.publish_share_menu.add_item(new zoto_publish_share_email_item({}));
		this.publish_share_menu.add_item(new zoto_publish_share_blog_item({}));
		this.publish_share_menu.add_item(new zoto_publish_share_flickr_item({}));
		this.main_menu.add_menu(this.publish_share_menu);
		//contacts
		this.contacts_menu = new zoto_contacts_menu({'title': _("contacts"), 'menu_level': 0});
		this.contacts_menu.add_item(new zoto_contacts_overview_item({}));
		this.contacts_menu.add_item(new zoto_contacts_add_remove_item({}));
		this.contacts_menu.add_item(new zoto_contacts_lists_item({}));
		this.contacts_menu.add_item(new zoto_contacts_privacy_item({}));
		this.contacts_menu.add_item(new zoto_contacts_settings_item({}));
		this.contacts_menu.add_item(new zoto_contacts_support_item({}));
		this.main_menu.add_menu(this.contacts_menu);
		//all video tutorials
		this.tutorials_menu = new zoto_tutorials_menu({'title': _("all video tutorials"), 'menu_level': 0});
		this.tutorials_menu.add_item(new zoto_tutorials_overview_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_install_uploader_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_use_uploader_item({}));
		// we'll put these back in when we get the tutorials done
		this.tutorials_menu.add_item(new zoto_tutorials_organize_photos_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_privacy_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_tagging_photos_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_lightbox_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_viewing_photos_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_publishing_photos_item({}));
		this.tutorials_menu.add_item(new zoto_tutorials_using_contacts_item({}));
		this.main_menu.add_menu(this.tutorials_menu);

		this.active_item = {};
		this.can_save = false;
		connect(this, 'SHOW_ITEM', this, 'show_item');
		this.initialized = true;
		this.open = false;
	},
//	show_menu_overview: function (menu) {
//		replaceChildNodes(this.help_content, menu.overview);
//	},
	show_item: function(item) {
		if (this.active_item === item) return;
		this.active_item = item;
		replaceChildNodes(this.help_title, this.active_item.options.title);
		replaceChildNodes(this.help_content, this.active_item.content_el);
	},
	generate_content: function() {
		var closer = A({'href': "javascript:void(0)", 'class': "close_x_link",'style': "margin-top: 2px; margin-right: 0px"});
		connect(closer, 'onclick', currentDocument().modal_manager, 'move_zig');
		this.close_button_el = DIV({'class': "modal_top_button_holder"}, closer);
		this.alter_size(775, 575);
		this.help_title = H5({'style': "font-style: italic"}, "");
		this.help_content = DIV({'class': "settings_holder"});
		this.help_pane = DIV({'class': "settings_pane"}, this.help_title, this.help_content);
		this.content = DIV({'class': "settings_content"},
			this.close_button_el,
			H3({}, _("help section")),
			// close link here
			DIV({'class': "settings_menu_holder"},
				H5({'style': "font-style: italic"}, _("topics")),
				this.main_menu.el
			),
			this.help_pane
		);
		signal(this.main_menu, 'SHOW_ITEM', this.main_menu);
	},
	reset: function() {
		if (this.active_item) {
			this.active_item = {};
		}
		replaceChildNodes(this.help_title);
		replaceChildNodes(this.help_content);
		signal(this.main_menu, 'SHOW_ITEM', this.main_menu);
	},
	set_class:function(){
		try{
			addElementClass(this.content.parentNode, 'modal_help');
		} catch(e){
		
		}
	},
	show_context: function(context) {
		for(var i=0; i < this.main_menu.submenus.length; i++) {
			for(var j=0; j < this.main_menu.submenus[i].items.length; j++) {
				if(this.main_menu.submenus[i].items[j].help_attribute == context) {
					this.main_menu.show_menu(this.main_menu.submenus[i]);
					this.main_menu.submenus[i].items[j].show_content();
					break;
				}
			}
		}
	},
	clean_up: function(){
		logDebug("cleanup being called");
		this.open = false;
		try {
			removeElementClass(this.content.parentNode, 'modal_help');
		} catch(e){
		
		}
	}

});

currentDocument().help_modal = new zoto_help_modal();
function show_help_modal(context) {
		currentDocument().help_modal.alter_size(775, 575);
		var hold_context = currentWindow().site_manager.current_context;
		if (!currentDocument().help_modal.initialized) {
			currentWindow().site_manager.current_context = "";
			currentDocument().help_modal.initialize();
		} else {
			currentDocument().help_modal.reset();
		}
		if (!currentDocument().help_modal.open) {
			currentDocument().help_modal.draw();
			currentDocument().help_modal.set_class();
			currentDocument().help_modal.open = true;
		}
		currentWindow().site_manager.current_context = hold_context;
		if (context) {
			currentDocument().help_modal.show_context(context);
		} else {
			var path = strip(window.location.pathname, chars='/');
			var segments = path.split('/');
			var item = "HELP_OVERVIEW_ABOUT";
			if (segments[0].length > 0) {
				if (segments[0] == "site") {
					switch (currentWindow().site_manager.current_context) {
						case "albums":
							item = "HELP_ALBUMS";
							break;
						case "messages":
							item = "HELP_ACCOUNT_MESSAGING";
							break;
						case "lightbox":
						case "explore":
							item = "HELP_VIEWING";
							break;
						case "contacts":
							item = "HELP_CONTACTS_OVERVIEW";
							break;
						case "tags":
							item = "HELP_TAGGING_OVERVIEW";
							break;
						case "detail":
							item = "HELP_VIEWING_IMAGE_DETAIL";
							break;
					}
				}
			}
			currentDocument().help_modal.show_context(item);
		}
}
connect(currentDocument(), "SHOW_HELP_MODAL", show_help_modal)
