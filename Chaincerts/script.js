/* global getAssetRegistry getFactory emit */


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

	var certificate = factory.newResource(NS, 'Certificate', id);
	var user = getUser(tx.issuerId);

	//certificate.certificateFields = user.role.authorizedFields;

	certificate.certificateFields = [];
	certificate.certificateData = [];

	/*
	for (var i = 0; i < certificateFields.size(); i ++){
        certificate.customData[i] = tx.certData[i];
	}
	*/

	certificate.issueDate = tx.timestamp;

	certificate.issuer = factory.newRelationship(NS, 'Institute', tx.instituteId);

	var inst;

	return getAssetRegistry(NS + '.Certificate')
		.then(function (certificateRegistry) {
			return certificateRegistry.addAll([certificate]);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (instituteRegistry) {
			return instituteRegistry.get(tx.instituteId);
		})
		.then(function (Institute) {
			inst = Institute;
			return Insitute.issuedCertificates.push(certificate);
		})
		.then(function () {
			return getParticipantRegistry(NS + '.Institute');
		})
		.then(function (Institute) {
			var factory = getFactory();
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

	//Create new admin role
	var factory = getFactory();
	var adminRole = factory.newResource(NS, '.Role', inst.id + '_admin');
	adminRole.authorizedFields = [];
	adminRole.institute = factory.newRelationship(NS, '.Institute', id);

	//Create public role
	var publicRole = factory.newResource(NS, '.Role', inst.id + '_public')
	public.authorizedFields = [];
	publicRole.institute = factory.newRelationship(NS, '.Institute', id);


	//create admin user
	var uid = 2;
	var admin = factory.newResource(NS, 'User', uid);
	admin.email = register.adminEmail;
	admin.firstName = register.adminFirstName;
	admin.lastName = register.adminLastName;
	admin.status = 'ACTIVE';

	//make institute the employer of admin account
	admin.employer = factory.newRelationship(NS, '.Institute', id);

	//set admin as admin role
	admin.role = factory.newRelationship(NS, '.Role', inst.id + '_admin');

	//add roles to institute
	inst.roles.push(adminRole);
	inst.roles.push(publicRole);

	//add admin user to insititute 
	institute.users.push(admin);

	var inst;

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
		.then(function(){
			return getAssetRegistry(NS + '.Role');
		})
		.then(function(roleRegistry){
			roleRegistry.addAdd([adminRole, publicRole]);
		})
}



/**
 * Adding a user by admin
 * @param {org.acme.chaincert.AddUser} data the user data
 * @transaction
 */


 //look into institute updating, done incorrectly
async function addUser(data) {

	var factory = getFactory();

	var uid = 3;
	var user = factory.newResource(NS, 'User', uid);
	user.email = data.email;
	user.firstName = data.firstName;
	user.lastName = data.lastName;
	user.status = 'ACTIVE';
	user.role = factory.newRelationship(NS, '.Role', data.roleId)
	user.employer = factory.newRelationship(NS, '.Institute', data.instituteId);

	var inst;

	return getParticipantRegistry(NS + '.User')
		.then(function (userRegistry) {
			userRegistry.addAll([user]);
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

/**Adding a field
 * @param {org.acme.chaincert.AddField} fieldData data of the field
 * @transaction
 * Will work on this tomrrow :) 
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
	if (field.type == 'DROPDOWN'){
		field.options = fieldData.options;
	} else {
		field.options = null;
	}
	
	
	//get all fields
	return getAssetRegistry(NS + '.Field')
		.then(function(fieldRegistry){
			//add new field
			return fieldRegistry.addAll([field]);
		})
		.then(function(){
			//get all roles
			return getAssetRegistry(NS + '.Role');
		})
		.then(function(roleRegistry){
			var factory = getFactory();
			//for each authroized role, add the field 
			//will this work??
			for (var i = 0; i < fieldData.authorizedViewers.size(); i++){
				var r = roleRegistry.get(fieldData.authorizedViewers[i].roleId);
				r.authorizedFields.push(field);	
				return roleRegistry.update(r);
			}
		})



}

/**
 * Sample transaction processor function.
 * @param {org.acme.chaincert.GetUser} data The sample transaction instance.
 * @transaction
 */
async function getUser(data) {

	return getParticipantRegistry(NS + 'User')
		.then(function (userRegistry) {
			return userRegistry.get(data);
		})

}



////////////////////////////////////////////////////
//////////////////////E N D/////////////////////////
////////////////////////////////////////////////////











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