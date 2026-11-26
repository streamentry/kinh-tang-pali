"""Exercise the APK verifier's signer identity check without an Android SDK."""

from pathlib import Path
import runpy
import unittest


verify_signer = runpy.run_path(str(Path(__file__).with_name("verify-android-preview.py")))["verify_signer"]
EXPECTED = "fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c"
OTHER = "0123456789abcdef" * 4


class SignerVerificationTests(unittest.TestCase):
    def test_scheme_label_from_the_actual_android_build_matches(self):
        verify_signer(
            "Verifies\nVerified using v2 scheme (APK Signature Scheme v2): true\n"
            "Number of signers: 1\n"
            "V2 Signer: certificate DN: CN=Android Debug, OU=Android, O=Unknown\n"
            f"V2 Signer: certificate SHA-256 digest: {EXPECTED}\n"
            f"V2 Signer: public key SHA-256 digest: {OTHER}\n",
            EXPECTED,
        )

    def test_scheme_labels_still_reject_a_different_key(self):
        with self.assertRaises(RuntimeError):
            verify_signer(
                "Number of signers: 1\n"
                f"V2 Signer: certificate SHA-256 digest: {OTHER}\n",
                EXPECTED,
            )

    def test_numbered_signer_matches_the_expected_certificate(self):
        verify_signer(
            "Verifies\nNumber of signers: 1\n"
            f"Signer #1 certificate SHA-256 digest: {EXPECTED.upper()}\n"
            f"Signer #1 public key SHA-256 digest: {OTHER}\n",
            EXPECTED,
        )

    def test_sdk_ranges_may_repeat_the_same_certificate(self):
        verify_signer(
            "Verifies\nNumber of signers: 1\n"
            f"Signer (minSdkVersion=24, maxSdkVersion=32) certificate SHA-256 digest: {EXPECTED}\n"
            f"Signer (minSdkVersion=33, maxSdkVersion=2147483647) certificate SHA-256 digest: {EXPECTED}\n",
            EXPECTED,
        )

    def test_a_different_certificate_in_any_sdk_range_is_rejected(self):
        with self.assertRaises(RuntimeError):
            verify_signer(
                "Number of signers: 1\n"
                f"Signer (minSdkVersion=24, maxSdkVersion=32) certificate SHA-256 digest: {EXPECTED}\n"
                f"Signer (minSdkVersion=33, maxSdkVersion=2147483647) certificate SHA-256 digest: {OTHER}\n",
                EXPECTED,
            )

    def test_missing_or_non_certificate_digests_are_rejected(self):
        for detail in [
            "",
            f"Signer #1 public key SHA-256 digest: {EXPECTED}\n",
            f"Source Stamp Signer certificate SHA-256 digest: {EXPECTED}\n",
            f"Signer #1 certificate SHA-256 digest: {EXPECTED[:-1]}\n",
            f"Signer #1 certificate SHA-256 digest: {EXPECTED}0\n",
        ]:
            with self.subTest(detail=detail), self.assertRaises(RuntimeError):
                verify_signer("Number of signers: 1\n" + detail, EXPECTED)

    def test_multiple_signers_are_rejected_even_with_identical_certificates(self):
        with self.assertRaises(RuntimeError):
            verify_signer(
                "Number of signers: 2\n"
                f"Signer #1 certificate SHA-256 digest: {EXPECTED}\n"
                f"Signer #2 certificate SHA-256 digest: {EXPECTED}\n",
                EXPECTED,
            )


if __name__ == "__main__":
    unittest.main()
