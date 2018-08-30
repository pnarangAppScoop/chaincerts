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
	var id = '1';

	//create Certificate
	var certificate = factory.newResource(NS, 'Certificate', id);

	//create Field and Data arrays
	certificate.certificateFields = [];
	certificate.certificateData = [];

	certificate.status = 'ACTIVE';


	//popoulate Data Array
	for (var i = 0; i < tx.certData.length; i++) {
		certificate.certificateData[i] = tx.certData[i];
	}

	//issueDate
	certificate.issueDate = tx.timestamp;


	//issuer
	certificate.issuer = factory.newRelationship(NS, 'Institute', tx.instituteId);

	var inst;
	var roleId = "INST_1_admin";

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(tx.issuerId);
		})
		.then(function (user) {
			roleId = user.role.getIdentifier();
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			return roleRegistry.get(roleId);
		})
		.then(function (userRole) {
			certificate.certificateFields = userRole.authorizedFields;
		})
		.then(function () {
			return getAssetRegistry(NS + '.Certificate');
		})
		.then(function (certificateRegistry) {
			//add certificate to blockchain
			return certificateRegistry.addAll([certificate]);
		})
		.then(function () {
			//get all institutes
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			//get issuing institute
			return instituteRegistry.get(tx.instituteId);
		})
		.then(function (Institute) {
			inst = Institute;
			//add certificate to list of certificates issued by institute
			return Institute.issuedCertificates.push(certificate);
		})
		.then(function () {
			//get all institutes
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			var factory = getFactory();
			//update institute on blockchain to reflect addition of data in certificates[] array
			return instituteRegistry.update(inst);
		})

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
	inst.issuedCertificates = [];
	inst.users = [];
	inst.roles = [];

	//Create new admin role
	var factory = getFactory();
	var adminRole = factory.newResource(NS, 'Role', id + '_admin');
	adminRole.roleName = "Admin"
	adminRole.authorizedFields = [];
	adminRole.institute = factory.newRelationship(NS, 'Institute', id);

	//Create public role
	var publicRole = factory.newResource(NS, 'Role', id + '_public')
	publicRole.roleName = "Public"
	publicRole.authorizedFields = [];
	publicRole.institute = factory.newRelationship(NS, 'Institute', id);


	//create admin user
	var uid = '2';
	var admin = factory.newResource(NS, 'User', uid);
	admin.email = register.adminEmail;
	admin.firstName = register.adminFirstName;
	admin.lastName = register.adminLastName;
	admin.status = 'ACTIVE';
	admin.phone = register.adminPhone;

	//make institute the employer of admin account
	admin.employer = factory.newRelationship(NS, 'Institute', id);

	//set admin as admin role
	admin.role = factory.newRelationship(NS, 'Role', id + '_admin');

	//add roles to institute
	inst.roles.push(adminRole);
	inst.roles.push(publicRole);

	//add admin user to insititute 
	inst.users.push(admin);

	var i;

	return getParticipantRegistry(NS + '.Institute')
		.then(function (instituteRegistry) {
			//add institiute to blockchain
			return instituteRegistry.addAll([inst]);
		})
		.then(function () {
			//get all users
			return getParticipantRegistry(NS + '.User');
		})
		.then(function (userRegistry) {
			//add institute admin to blockchain
			return userRegistry.addAll([admin]);
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			roleRegistry.addAll([adminRole, publicRole]);
		})
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
	user.role = factory.newRelationship(NS, 'Role', data.roleId)
	user.employer = factory.newRelationship(NS, 'Institute', data.instituteId);
	user.phone = data.phone;

	var inst;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.addAll([user]);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(data.instituteId);
		})
		.then(function (Institute) {
			inst = Institute;
			Institute.users.push(user);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			var factory = getFactory();
			return instituteRegistry.update(inst);
		})




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
	field.options = fieldData.options;

	field.authorizedViewersRoleId = [];
	field.authorizedViewersRoleId = fieldData.authorizedViewersRoleId;



	/**
	return getAssetRegistry(NS + '.Field')
		.then(function(fieldRegistry){
			field.authorizedViewersRoleId.push(fieldData.instituteId + '_admin');
			return fieldRegistry.addAll([field]);
		})
		.then(function(){
			return getAssetRegistry(NS + '.Role');
		})
		.then(function(roleRegistry){
			return roleRegistry.get(fieldData.instituteId + '_admin');
		})
		.then(function(adminRole){
			r = adminRole;
			adminRole.authorizedFields.push(field);
		})
		.then(function() {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function(roleRegistry){
			return roleRegistry.update(r);
			//need to update institute too
		})
*/

	var rids = [];

	field.authorizedViewersRoleId.push(fieldData.instituteId + '_admin');

	var roleRegistry = await getAssetRegistry(NS + '.Role');
	var fieldRegistry = await getAssetRegistry(NS + '.Field');
	fieldRegistry.addAll([field]);

	var adminRole = await roleRegistry.get(fieldData.instituteId + '_admin');
	adminRole.authorizedFields.push(field);

	for (var i = 0; i < fieldData.authorizedViewersRoleId.length; i++) {
		rids[i] = await roleRegistry.get(fieldData.authorizedViewersRoleId[i]);
		rids[i].authorizedFields.push(field);
	}

	roleRegistry.update(adminRole);

	for (var i = 0; i < fieldData.authorizedViewersRoleId.length; i++) {
		roleRegistry.update(rids[i]);
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
	role.authorizedFields = [];

	//establish relationship between role and institute
	role.institute = factory.newRelationship(NS, 'Institute', roleData.instituteId);


	var inst;

	return getAssetRegistry(NS + '.Role')
		.then(function (roleRegistry) {
			roleRegistry.addAll([role]);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(roleData.instituteId);
		})
		.then(function (institute) {
			inst = institute;
			institute.roles.push(role);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(inst);
		})

}



/**
 * Add an existing field to an existing role
 * @param {org.acme.chaincert.AddFieldToRole} fieldData - data of field 
 * @transaction
 */

function addFieldToRole(fieldData) {

	var f;
	var r;

	return getAssetRegistry(NS + '.Field')
		.then(function (fieldRegistry) {
			return fieldRegistry.get(fieldData.fieldId);
		})
		.then(function (field) {
			f = field;
			//add role to authorized viewers
			field.authorizedViewersRoleId.push(fieldData.roleId);
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			return roleRegistry.get(fieldData.roleId);
		})
		.then(function (role) {
			//add field to role's authorized fields
			r = role;
			role.authorizedFields.push(f);
		})
		.then(function () {
			return getAssetRegistry(NS + '.Field');
		})
		.then(function (fieldRegistry) {
			//update field on blockchain
			fieldRegistry.update(f);
		})
		.then(function () {
			getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			//update role on blockchain
			roleRegistry.update(r);
		})


}

/**
 * Rmeove access to a field from a user
 * @param {org.acme.chaincert.RemoveFieldFromRole} fieldData - data of field
 * @transaction
 */

function removeFieldFromRole(fieldData) {
	//possibly need to update institute here?
	var f;
	var r;

	return getAssetRegistry(NS + '.Field')
		.then(function (fieldRegistry) {
			return fieldRegistry.get(fieldData.fieldId);
		})
		.then(function (field) {
			f = field;
			var index = field.authorizedViewersRoleId.indexOf(fieldData.roleId);
			if (index > -1) {
				field.authorizedViewersRoleId.splice(index, 1);
			}
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			return roleRegistry.get(fieldData.roleId);
		})
		.then(function (role) {
			r = role;
			index = role.authorizedFields.splice(f);
			if (index > -1) {
				role.authorizedFields.splice(index, 1);
			}
		})
		.then(function () {
			return getAssetRegistry(NS + '.Field');
		})
		.then(function (fieldRegistry) {
			fieldRegistry.update(f);
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			roleRegistry.update(r);
		})
}


/**
 * updateCertificate function - to update a certificate to match new fields
 * @param {org.acme.chaincert.UpdateCertificate} newData - new certificate Data
 * @transaction
 */


function updateCertificate(newData) {

	var c;
	var i;
	var r;
	var roleId;
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

function editUserFirstName(userData) {

	var instId;
	var i;
	var u;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(userData.uid);
		})
		.then(function (user) {
			u = user;
			user.firstName = userData.newFirstName
			instId = user.employer.getIdentifier();
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(instId);
		})
		.then(function (institute) {
			i = institute;

			for (var cnt = 0; cnt < institute.users.length; cnt++) {
				if (institute.users[cnt].uid == userData.uid) {
					institute.users[cnt].firstName = userData.newFirstName;
				}
			}

		})
		.then(function () {
			return getParticipantRegistry(NS + '.User');
		})
		.then(function (userRegistry) {
			userRegistry.update(u);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})


}

/**
	* Edit User's Last Name
	@param {org.acme.chaincert.EditUserLastName} userData - user data
	@transaction
    */

function editUserLastName(userData) {

	var instId;
	var i;
	var u;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(userData.uid);
		})
		.then(function (user) {
			u = user;
			user.lastName = userData.newLastName
			instId = user.employer.getIdentifier();
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(instId);
		})
		.then(function (institute) {
			i = institute;

			for (var cnt = 0; cnt < institute.users.length; cnt++) {
				if (institute.users[cnt].uid == userData.uid) {
					institute.users[cnt].lastName = userData.newLastName;
				}
			}

		})
		.then(function () {
			return getParticipantRegistry(NS + '.User');
		})
		.then(function (userRegistry) {
			userRegistry.update(u);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})


}

/**
	* Edit User's Email Address
	@param {org.acme.chaincert.EditUserEmail} userData - user data
	@transaction
    */

function editUserEmail(userData) {

	var instId;
	var i;
	var u;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(userData.uid);
		})
		.then(function (user) {
			u = user;
			user.email = userData.newEmail
			instId = user.employer.getIdentifier();
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(instId);
		})
		.then(function (institute) {
			i = institute;

			for (var cnt = 0; cnt < institute.users.length; cnt++) {
				if (institute.users[cnt].uid == userData.uid) {
					institute.users[cnt].email = userData.newEmail;
				}
			}

		})
		.then(function () {
			return getParticipantRegistry(NS + '.User');
		})
		.then(function (userRegistry) {
			userRegistry.update(u);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})


}

/**
	* Edit User's Email Address
	@param {org.acme.chaincert.EditUserPhone} userData - user data
	@transaction
    */

function editUserPhone(userData) {

	var instId;
	var i;
	var u;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(userData.uid);
		})
		.then(function (user) {
			u = user;
			user.phone = userData.newPhone
			instId = user.employer.getIdentifier();
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(instId);
		})
		.then(function (institute) {
			i = institute;

			for (var cnt = 0; cnt < institute.users.length; cnt++) {
				if (institute.users[cnt].uid == userData.uid) {
					institute.users[cnt].phone = userData.newPhone;
				}
			}

		})
		.then(function () {
			return getParticipantRegistry(NS + '.User');
		})
		.then(function (userRegistry) {
			userRegistry.update(u);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})


}

/**
	* Edit User's Email Address
	@param {org.acme.chaincert.ChangeUserStatus} userData - user data
	@transaction
    */

function changeUserStatus(userData) {

	var instId;
	var i;
	var u;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			return userRegistry.get(userData.uid);
		})
		.then(function (user) {
			u = user;

			if (user.status == "ACTIVE") {
				user.status = "INACTIVE";
			} else {
				user.status = "ACTIVE";
			}

			instId = user.employer.getIdentifier();
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(instId);
		})
		.then(function (institute) {
			i = institute;

			for (var cnt = 0; cnt < institute.users.length; cnt++) {
				if (institute.users[cnt].uid == userData.uid) {

					if (institute.users[cnt].status == "ACTIVE") {
						institute.users[cnt].status = "INACTIVE";
					} else {
						institute.users[cnt].status = "ACTIVE";
					}
				}
			}

		})
		.then(function () {
			return getParticipantRegistry(NS + '.User');
		})
		.then(function (userRegistry) {
			userRegistry.update(u);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			instituteRegistry.update(i);
		})


}


/**
 * View all certificates isssued by an institute
 * @param {org.acme.chaincert.ViewIssuedCertificates} instId - institute Id
 * @transaction
 */

function viewIssuedCertificates(instId) {

	return getParticipantRegistry(NS + '.Institute')
		.then(function (instituteRegistry) {
			instituteRegistry.get(instId.instituteId);
		})
		.then(function (institute) {
			return institute.issuedCertificates;
		})

}


/**
 * Edit a field name
 * @param {org.acme.chaincert.EditFieldName} fieldData - field name and id
 * @transaction
 */

function editFieldName(fieldData) {

	var f;
	var r = [];
	var rids = [];

	return getAssetRegistry(NS + ".Field")
		.then(function (fieldRegistry) {
			return fieldRegistry.get(fieldData.fieldId);
		})
		.then(function (field) {
			f = field;
			field.name = fieldData.newFieldName;
			rids = field.authorizedViewersRoleId;
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			for (var i = 0; i < rids.length; i++) {
				r[i] = roleRegistry.get(rids[i]);
				for (var j = 0; j < r[i].authorizedFields.length; j++) {
					if (r[i].authorizedFields[j].fieldId == fieldData.fieldId) {
						r[i].authorizedFields[j].name = fieldData.newFieldName;
					}
				}
			}
		})
		.then(function () {
			return getAssetRegistry(NS + '.Field');
		})
		.then(function (fieldRegistry) {
			fieldRegistry.update(f);
		})
		.then(function () {
			return getAssetRegistry(NS + '.Role');
		})
		.then(function (roleRegistry) {
			for (var i = 0; i < r.length; i++) {
				return roleRegistry.update(r[i]);
			}
		})


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