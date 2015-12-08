package com.ecm.servicios.seguridad.firma.business.impl;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.Provider;
import java.security.PublicKey;
import java.security.Security;
import java.security.Signature;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import javax.xml.bind.DatatypeConverter;

import org.junit.Test;

public class test {

	/** provider Bouncy Castle */
	private static final Provider provider = Security.getProvider("BC");

	@Test
	public void test_ValidateSignature_PDF_meine() {

		String certificadoBase64 = "";
		String hashOriginal_ = "";
		String signBytes_hex = "";

		try {

			byte[] hashOriginal = DatatypeConverter.parseBase64Binary(hashOriginal_);
			byte[] signBytes = DatatypeConverter.parseHexBinary(signBytes_hex);

			Certificate cert = getCertificateFormStringB64(certificadoBase64);

			PublicKey publicKey = cert.getPublicKey();

			Signature sig = Signature.getInstance("SHA1withRSA", provider);

			sig.initVerify(publicKey);

			sig.update(hashOriginal);

			boolean isValid = sig.verify(signBytes);

			System.out.println(isValid);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/**
	 * get certificate from b64 string.
	 * 
	 * @param certificateStringB64
	 * @return
	 * @throws CertificateException
	 */
	private Certificate getCertificateFormStringB64(String certificateStringB64) throws CertificateException {

		byte[] decodedBytes = DatatypeConverter.parseBase64Binary(certificateStringB64);

		CertificateFactory cf = CertificateFactory.getInstance("X.509", provider);
		InputStream inStream = new ByteArrayInputStream(decodedBytes);
		X509Certificate cert = (X509Certificate) cf.generateCertificate(inStream);

		return cert;

	}

}
