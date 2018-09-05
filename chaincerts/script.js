/* global getAssetRegistry getFactory emit */



// ____  _           _                     _       
/// ___|| |__   __ _(_)_ __   ___ ___ _ __| |_ ___ 
//| |   | '_ \ / _` | | '_ \ / __/ _ \ '__| __/ __|
//| |__ | | | | (_| | | | | | (_|  __/ |  | |_\__ \
//\____||_| |_|\__,_|_|_| |_|\___\___|_|   \__|___/
//												


var NS = 'org.acme.chaincert';




/**
 * Sample transaction processor function.
 * @param {org.acme.chaincert.IssueCertificate} tx The sample transaction instance.
 * @transaction
 */


async function issueCertificate(tx) {

	//create new certificate
	var factory = getFactory();

	//hash here
	//var hash = parseInt(sha256(tx.firstName),10)%100;
	//var id = "CERT_" + hash.toString();
	var id = '1';

	//create Certificate
	var certificate = factory.newResource(NS, 'Certificate', id);

	//create Field and Data arrays
	certificate.certificateFields = [];
	certificate.certificateData = [];

	certificate.status = 'ACTIVE';

	certificate.events = [];


	//popoulate Data Array
	for (var i = 0; i < tx.certData.length; i++) {
		certificate.certificateData[i] = tx.certData[i];
	}

	//issueDate
	certificate.issueDate = tx.timestamp;


	//issuer
	certificate.issuer = factory.newRelationship(NS, 'Institute', tx.instituteId);

	var inst;
	var roleId;


	var userRegistry = await getParticipantRegistry(NS + '.User');
	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var certificateRegistry = await getAssetRegistry(NS + '.Certificate');

	var issuingUser = await userRegistry.get(tx.issuerId);
	var issuingUserRole = await  roleRegistry.get(issuingUser.roleId);
	var certificateFieldIds = issuingUserRole.authorizedFieldIds;


	//populate certificate field data
	for (var i = 0; i < certificateFieldIds.length; i++){
		var f = await fieldRegistry.get(certificateFieldIds[i]);
		certificate.certificateFields.push(f);
	}

	certificateRegistry.addAll([certificate]);

	var issuingInstitute = await instituteRegistry.get(tx.instituteId);
	issuingInstitute.issuedCertificateIds.push(id);

	instituteRegistry.update(issuingInstitute);
}

/**
async function issueCertificate(tx) {  
  
  //create new certificate
  var factory = getFactory();
  
  var hash = parseInt(sha256(tx.firstName),10)%100;
  var id = "CERT_" + hash.toString();
  
  var cert = factory.newResource(NS,'Certificate', id);
  cert.description = tx.description;;
  cert.firstName = tx.firstName;
  cert.lastName = tx.lastName;
  cert.issueDate = tx.timestamp;
  cert.expiryDate = tx.expiryDate;
  cert.studentId = tx.studentId;
  	
  
  
  //link certificate to issuer
  //String issuerId = tx.instituteId;
  cert.issuer = factory.newRelationship(NS, 'Institute', tx.instituteId);
  
  //add certificate to issuers list of certificates
  
  var inst;
  
  return getAssetRegistry(NS + '.Certificate')
  	.then(function(certificateRegistry){
    		return certificateRegistry.addAll([cert])
  		})
  	.then(function(){
    	return getParticipantRegistry(NS + '.Institute');
  		})
  	.then(function(instituteRegistry){
    	return instituteRegistry.get(tx.instituteId);
  		})
  	.then(function(institute){
    	inst = institute;
    	institute.issuedCertificates.push(cert);
  		})
  	.then(function(){
    	return getParticipantRegistry(NS + '.Institute');
  		})
  	.then(function(instituteRegistry){
    	var factory = getFactory();
    	return instituteRegistry.update(inst);
    	})
  
}

 */



/**
 * Create new Institue
 * @param {org.acme.chaincert.RegisterInstitute} register
 *@transaction
 */

async function registerInstitute(register) {

	//var hash = parseInt(sha256(register.name) ,10)%100;
	//var id = "INST_" + hash.toString();

	var id = 'INST_1';

	//create Institute particpant
	var factory = getFactory();
	var inst = factory.newResource(NS, 'Institute', id);
	inst.name = register.name;
	inst.description = register.description;
	inst.issuedCertificateIds = [];
	inst.userIds = [];
	inst.roleIds = [];

	//Create new admin role
	var adminRole = factory.newResource(NS, 'Role', id + '_admin');
	adminRole.roleName = "Admin"
	adminRole.authorizedFieldIds = [];
	adminRole.instituteId = id;
	adminRole.status = 'ACTIVE';

	//Create public role
	var publicRole = factory.newResource(NS, 'Role', id + '_public')
	publicRole.roleName = "Public"
	publicRole.authorizedFieldIds = [];
	publicRole.instituteId = id;
	publicRole.status = 'ACTIVE';


	//create admin user
	var uid = '2';
	var admin = factory.newResource(NS, 'User', uid);
	admin.email = register.adminEmail;
	admin.firstName = register.adminFirstName;
	admin.lastName = register.adminLastName;
	admin.status = 'ACTIVE';
	admin.phone = register.adminPhone;

	//make institute the employer of admin account
	admin.employerId = id;

	//set admin as admin role
	admin.roleId = id + '_admin';

	//add roles to institute
	inst.roleIds.push(id + '_admin');
	inst.roleIds.push(id + '_public');

	//add admin user to insititute 
	inst.userIds.push(uid);

	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var userRegistry = await getParticipantRegistry(NS + '.User');

	await userRegistry.addAll([admin]);
  
	await roleRegistry.addAll([adminRole, publicRole]);
  
  	await instituteRegistry.addAll([inst]);
}



/**
 * Adding a user by admin
 * @param {org.acme.chaincert.AddUser} data the user data
 * @transaction
 */
async function addUser(data) {

	var factory = getFactory();

	var uid = "3";
	var user = factory.newResource(NS, 'User', uid);
	user.email = data.email;
	user.firstName = data.firstName;
	user.lastName = data.lastName;
	user.status = 'ACTIVE';
	user.roleId = data.roleId;
	user.employerId = data.instituteId;
	user.phone = data.phone;

	var userRegistry = await getParticipantRegistry(NS + '.User');
	userRegistry.addAll([user]);

	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var inst = await instituteRegistry.get(data.instituteId);
	inst.userIds.push(uid);
	instituteRegistry.update(inst);
}

/**
 * Sample transaction processor function.
 * @param {org.acme.chaincert.VerifyCertificate} verify The sample transaction instance.
 * @transaction
 */

async function verifyCertificate(verify) {

	return getAssetRegistry(NS + '.Certificate')
		.then(function (certificateRegistry) {
			return certificateRegistry.get(verify.certificateID);
		})

}


/**
 * Sample transaction processor function.
 * @param {org.acme.chaincert.GetUser} userData The sample transaction instance.
 * @transaction
 */
async function getUser(userData) {

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(userData.uid);
		})

}

//need ot make fixes to this function - add field to all authorized viewers
/**Adding a field
 * @param {org.acme.chaincert.AddField} fieldData data of the field
 * @transaction
 */

async function addField(fieldData) {

	var factory = getFactory();

	var id = "1";
	//create Field
	var field = factory.newResource(NS, 'Field', id);
	//add Field data
	//field Name
	field.name = fieldData.name;
	//field Type (enum)
	field.type = fieldData.type;
	//field Options (only if dropdown)
	field.options = [];

	field.status = 'ACTIVE';

	if(fieldData.type == "DROPDOWN"){
		field.options = fieldData.options;
	}

	field.authorizedViewersRoleIds = [];
	field.authorizedViewersRoleIds = fieldData.authorizedViewersRoleIds;


	var rids = [];

	field.authorizedViewersRoleIds.push(fieldData.instituteId + '_admin');

	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	await fieldRegistry.addAll([field]);

	var adminRole = await roleRegistry.get(fieldData.instituteId + '_admin');
	adminRole.authorizedFieldIds.push(id);

	for (var i = 0; i < fieldData.authorizedViewersRoleIds.length; i++) {
		rids[i] = await roleRegistry.get(fieldData.authorizedViewersRoleIds[i]);
		rids[i].authorizedFieldIds.push(id);
	}

	await roleRegistry.update(adminRole);

	for (var i = 0; i < fieldData.authorizedViewersRoleIds.length; i++) {
		await roleRegistry.update(rids[i]);
	}

}


/**
 * Add Role
 * @param {org.acme.chaincert.AddRole} roleData
 * @transaction
 */

async function addRole(roleData) {

	var factory = getFactory();


	//hash role id
	var rid = "1";

	//create role
	var role = factory.newResource(NS, 'Role', rid);

	//set role name
	role.roleName = roleData.roleName;

	//authorized fields are empty
	//array is filled when fields are added
	role.authorizedFieldIds= [];

	//establish relationship between role and institute
	role.instituteId = roleData.instituteId;

	role.status = 'ACTIVE';


	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var roleRegistry = await getAssetRegistry(NS + '.Role');
	roleRegistry.addAll([role]);
	
	var inst = await instituteRegistry.get(roleData.instituteId);
	inst.roleIds.push(rid);

	instituteRegistry.update(inst);
}



/**
 * Add an existing field to an existing role
 * @param {org.acme.chaincert.AddFieldToRole} fieldData - data of field 
 * @transaction
 */

async function addFieldToRole(fieldData) {

	var fieldRegistry =  await getAssetRegistry(NS + '.Field');
	var roleRegistry = await getAssetRegistry(NS + '.Role');

	var f = await fieldRegistry.get(fieldData.fieldId);
	f.authorizedViewersRoleIds.push(fieldData.roleId);
	await fieldRegistry.update(f);

	var r = await roleRegistry.get(fieldData.roleId);
	r.authorizedFieldIds.push(fieldData.fieldId);
	await roleRegistry.update(r);
}

/**
 * Rmeove access to a field from a user
 * @param {org.acme.chaincert.RemoveFieldFromRole} fieldData - data of field
 * @transaction
 */

async function removeFieldFromRole(fieldData) {

	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	var f = await fieldRegistry.get(fieldData.fieldId);
	var index = f.authorizedViewersRoleIds.indexOf(fieldData.roleId);
	if (index > -1){
		f.authorizedViewersRoleIds.splice(index,1);
	}
	
	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var r = await roleRegistry.get(fieldData.roleId);
	index = r.authorizedFieldIds.indexOf(fieldData.fieldId);
	if (index > -1){
		r.authorizedFieldIds.splice(index, 1);
	}

	await fieldRegistry.update(f);
	await roleRegistry.update(r);
}


/**
 * updateCertificate function - to update a certificate to match new fields
 * @param {org.acme.chaincert.UpdateCertificate} newData - new certificate Data
 * @transaction
 */


async function updateCertificate(newData) {
	//fix this
	var userRegistry = await getParticipantRegistry(NS + '.User');
	var u = await userRegistry.get(newData.issuerId);
	var roleId = await u.role.getIdentifier();

	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var cerificateRegistry = await getAssetRegistry(NS + '.Certificate');

	var c = await certificateRegistry.get(newData.certificateId);

	var i;
	var r;
	
	var instId;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			userRegistry.get(newData.issuerId);
		})
		.then(function (user) {
			roleId = u.role.getIdentifier();
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			r = roleRegistry.get(roleId);
		})
		.then(function () {
			return getAssetRegistry(NS + '.Certificate');
		})
		.then(function (certificateRegistry) {
			//get all certificates
			return certificateRegistry.get(newData.certificateId);
		})
		.then(function (certificate) {
			c = certificate;
			//change old certiicate data
			certificate.certificateData = newData.certificateData;
			certificate.certificateFields = r.authorizedFields;
			instId = certificate.issuer.getIdentifier;
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(instId);
		})
		.then(function (institute) {
			i = institute;
		})
		.then(function () {
			return getAssetRegistry(NS + '.Certificate');
		})
		.then(function (certificateRegistry) {
			certificateRegistry.update(c);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})


}


/**
 * Make a certificate inactive [void]
 * @param {org.acme.chaincert.VoidCertificate} certId - certificate
 * @transaction 
 */

function VoidCertificate(certId) {
//fix this
	var c;
	var i;
	var instId;
	return getAssetRegistry(NS + '.Certificate')
		.then(function (certificateRegistry) {
			return certificateRegistry.get(certId.certificateId);
		})
		.then(function (certificate) {
			c = certificate;
			certificate.status = 'INACTIVE';
			instId = certificate.issuer.getIdentifier();
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (institiuteRegistry) {
			return nstituteRegistry.get(instId);
		})
		.then(function (institiute) {
			i = institute;
		})
		.then(function () {
			return getAssetRegistry(NS + '.Certificate');
		})
		.then(function (certificateRegistry) {
			certificateRegistry.update(c);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})

}


/**
	* Edit User First Name
	@param {org.acme.chaincert.EditUserFirstName} userData - user data
	@transaction
    */

async function editUserFirstName(userData) {

	var userRegistry = await getParticipantRegistry (NS + '.User');
	var u = await userRegistry.get(userData.uid);

	u.firstName = userData.newFirstName;
	await userRegistry.update(u);
}

/**
	* Edit User's Last Name
	@param {org.acme.chaincert.EditUserLastName} userData - user data
	@transaction
    */

async function editUserLastName(userData) {


	var userRegistry = await getParticipantRegistry (NS + '.User');
	var u = await userRegistry.get(userData.uid);

	u.lastName = userData.newLastName;
	await userRegistry.update(u);


}

/**
	* Edit User's Email Address
	@param {org.acme.chaincert.EditUserEmail} userData - user data
	@transaction
    */

async function editUserEmail(userData) {

	
	var userRegistry = await getParticipantRegistry (NS + '.User');
	var u = await userRegistry.get(userData.uid);

	u.email = userData.newEmail;
	await userRegistry.update(u);


}

/**
	* Edit User's Email Address
	@param {org.acme.chaincert.EditUserPhone} userData - user data
	@transaction
    */

async function editUserPhone(userData) {

	
	var userRegistry = await getParticipantRegistry (NS + '.User');
	var u = await userRegistry.get(userData.uid);

	u.phone = userData.newPhone;
	await userRegistry.update(u);

}

/**
	* Edit User's Email Address
	@param {org.acme.chaincert.ChangeUserStatus} userData - user data
	@transaction
    */

async function changeUserStatus(userData) {

		
	var userRegistry = await getParticipantRegistry(NS + '.User');
	var u = await userRegistry.get(userData.uid);

	if (u.status == "ACTIVE"){
		u.status = "INACTIVE";
	} else {
		u.status = "ACTIVE";
	}

	await userRegistry.update(u);


}

/**
	@param {org.acme.chaincert.ChangeRoleStatus} roleData - role data
	@transaction
    */

   async function changeRoleStatus(roleData) {

		
	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var r = await roleRegistry.get(roleData.roleId);

	if (r.status == "ACTIVE"){
		r.status = "INACTIVE";
	} else {
		r.status = "ACTIVE";
	}

	await roleRegistry.update(r);


}

/**
	@param {org.acme.chaincert.ChangeFieldStatus} fieldData - role data
	@transaction
    */

   async function changeFieldStatus(fieldData) {

		
	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	var f = await fieldRegistry.get(fieldData.fieldId);

	if (f.status == "ACTIVE"){
		f.status = "INACTIVE";
	} else {
		f.status = "ACTIVE";
	}

	await fieldRegistry.update(f);

}



/**
 * View all certificates isssued by an institute
 * @param {org.acme.chaincert.ViewIssuedCertificates} instId - institute Id
 * @transaction
 */

async function viewIssuedCertificates(instId) {

	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var i = await instituteRegistry.get(instId.instituteId);

	var cids = i.issuedCertificateIds;

	var certificateRegistry = await getAssetRegistry(NS + '.Certificate');

	var cs = []
	var c;

	for (var i = 0; i > cids.length; i++){
		c = await certificateRegistry.get(cids[i]);
		cs.push(c);
	}

	return cs;
}


/**
 * Edit a field name
 * @param {org.acme.chaincert.EditFieldName} fieldData - field name and id
 * @transaction
 */

async function editFieldName(fieldData) {

	var f;

	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	f = await fieldRegistry.get(fieldData.fieldId);
	f.name = fieldData.newFieldName;
	await fieldRegistry.update(f);
}


/**
 * Edit a field name
 * @param {org.acme.chaincert.EditFieldType} fieldData - field name and id
 * @transaction
 */

async function editFieldType(fieldData) {

	var f;

	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	f = await fieldRegistry.get(fieldData.fieldId);
	f.type = fieldData.newFieldType;

	if (fieldData.newFieldType == "DROPDOWN"){
		f.options = fieldData.options;
	}

	await fieldRegistry.update(f);
}

/**
 * Edit a field name
 * @param {org.acme.chaincert.EditRoleName} roleData - field name and id
 * @transaction
 */

async function editRoleName(roleData) {

	var r;

	var roleRegistry = await getAssetRegistry(NS + '.Role');
	r = await roleRegistry.get(roleData.roleId);
	r.roleName = roleData.newRoleName;

	await roleRegistry.update(r);
}

/**
 * Edit a field name
 * @param {org.acme.chaincert.EditUserRole} data - field name and id
 * @transaction
 */

async function editUserRole(data) {

	var u;

	var userRegistry = await getParticipantRegistry(NS + '.User');
	var roleRegistry = await getAssetRegistry(NS + '.Role');

	var isRole = await roleRegistry.exists(data.roleId);
	
	if (isRole){
		u = await userRegistry.get(data.userId);
		u.roleId = data.roleId;
	}

	await userRegistry.update(u);
}


/**
 * createEventType
 * @param {org.acme.Chaincert.CreateEventType} eventTypeData - event Type data
 * @transaction
 */

 async function createEventType(eventTypeData){

	var factory = getFactory();
	var id = '1';
	var eventType = factory.newResource(NS, 'EventType', id);
	//create event type
	eventType.eventName = eventTypeData.eventName;
	eventType.authorizedViewersRoleIds = eventTypeData.authorizedViewersRoleIds;
	eventType.eventFieldIds = [];
	eventType.status = 'ACTIVE';

	var eventTypeRegistry = await getAssetRegistry(NS + '.EventType');
	//add to blockchain
	await eventTypeRegistry.addAll([eventType]);
	
	var roleRegistry = await getAssetRegistry(NS + '.Role');
	//add eventtype to admin
	var adminRole = await roleRegistry.get(eventTypeData.instituteId + '_admin');
	await adminRole.authorizedEventTypeIds.push(id);

	var rids = [];
	var r = [];
	rids = eventTypeData.authorizedViewersRoleIds;
	//add eventtype to all authorized roles
	for (var i = 0; i < rids.length; i++){
		r[i] = await roleRegistry.get(rids[i]);
		r[i].authroizedEventTypeIds.push(id);
	}
	
	//update blockchain
	await roleRegistry.update(adminRole);

	for (var i = 0; i < r.length; i++){
		await roleRegistry.update(r[i]);
	}

 }

 /**
  * AddFieldToEventType
  * @param {org.acme.Chaincert.AddFieldToEventType} fieldData - fieldId
  * @transaction
  */

  async function addFieldToEventType(fieldData){

	var eventTypeRegistry = await getAssetRegistry(NS + '.EventType');
	var eventType = await eventTypeRegistry.get(fieldData.eventTypeId);

	eventType.eventFieldIds.push(fieldData.fieldId);

	await eventTypeRegistry.update(eventType);
  }


  /**
   * logEvent
   * @param {org.acme.Chaincert.LogEvent} eventData - event
   * @transaction
   */

   async function logEvent(eventData){

	var factory = getFactory();
	var id = 1;
	var event = factory.newResource(NS, 'Event', id);

	var eventTypeRegistry = await getAssetRegistry(NS + '.EventType');
	var eventType = await eventTypeRegistry.get(eventData.eventTypeId);

	event.eventName = eventType.eventName;
	
	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	//for loop for fields
	var fids = eventType.eventFieldIds;

	for (var i = 0; i < fids.length; i++){
		var f = await fieldRegistry.get(fids[i]);
		event.eventFields.push(f);
	}

	event.eventDetails = eventData.eventDetails;

	event.issuderId = eventData.issuerId;
	event.issueTime = eventData.timestamp;

	var eventRegistry = getAssetRegistry(NS + '.Event');
	await eventRegistry.addAll([event]);

	var certificateRegistry = getAssetRegistry(NS + '.Certificate');
	var c = certificateRegistry.get(eventData.certificateId);

	c.events.push(event);
	await certificateRegistry.update(c);

   }

 /**
* Edit Institute Name
@param {org.acme.Chaincert.EditInstituteName} instData - institue Data
@transacton
*/

async function editInstituteName(instData){

	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var i = await instituteRegistry.get(instData.instituteId);

	if (issuer.id == instData.instituteId + '_admin'){
		i.name = instData.newName;
	}

	await instituteRegistry.update(i);
}

/**
* Edit Institute Name
@param {org.acme.Chaincert.EditInstituteDescription} instData - institue Data
@transacton
   */

   async function editInstituteDescription(instData){

	var instituteRegistry = await getParticipantRegistry(NS + '.Institute');
	var i = await instituteRegistry.get(instData.instituteId);

	if (issuer.id == instData.instituteId + '_admin'){
		i.description = instData.newDescription;
	}

	await instituteRegistry.update(i);
}


	

//______ _   _ _____  
//|  ____| \ | |  __ \ 
//| |__  |  \| | |  | |
//|  __| | . ` | |  | |
//| |____| |\  | |__| |
//|______|_| \_|_____/ 
//					 












//hash function
var sha256 = function sha256(ascii) {
	function rightRotate(value, amount) {
		return (value >>> amount) | (value << (32 - amount));
	};

	var mathPow = Math.pow;
	var maxWord = mathPow(2, 32);
	var lengthProperty = 'length'
	var i, j; // Used as a counter across the whole file
	var result = ''

	var words = [];
	var asciiBitLength = ascii[lengthProperty] * 8;

	//* caching results is optional - remove/add slash from front of this line to toggle
	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
	// (we actually calculate the first 64, but extra values are just ignored)
	var hash = sha256.h = sha256.h || [];
	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
	var k = sha256.k = sha256.k || [];
	var primeCounter = k[lengthProperty];
	/*/
	var hash = [], k = [];
	var primeCounter = 0;
	//*/

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
			k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
		}
	}

	ascii += '\x80' // Append Ƈ' bit (plus zero padding)
	while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i);
		if (j >> 8) return; // ASCII check: only accept characters in range 0-255
		words[i >> 2] |= j << ((3 - i) % 4) * 8;
	}
	words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
	words[words[lengthProperty]] = (asciiBitLength)

	// process each chunk
	for (j = 0; j < words[lengthProperty];) {
		var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
		var oldHash = hash;
		// This is now the undefinedworking hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8);

		for (i = 0; i < 64; i++) {
			var i2 = i + j;
			// Expand the message into 64 words
			// Used below if 
			var w15 = w[i - 15],
				w2 = w[i - 2];

			// Iterate
			var a = hash[0],
				e = hash[4];
			var temp1 = hash[7] +
				(rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
				+
				((e & hash[5]) ^ ((~e) & hash[6])) // ch
				+
				k[i]
				// Expand the message schedule if needed
				+
				(w[i] = (i < 16) ? w[i] : (
					w[i - 16] +
					(rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
					+
					w[i - 7] +
					(rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
				) | 0);
			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
			var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
				+
				((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

			hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
			hash[4] = (hash[4] + temp1) | 0;
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0;
		}
	}

	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i] >> (j * 8)) & 255;
			result += ((b < 16) ? 0 : '') + b.toString(16);
		}
	}
	return result;
};