# Security Policy

OrchStep ships a free, open execution engine (`orchstep-core`) and a closed Pro
layer. Because the Pro engine is closed source, we lean on verifiable supply-chain
artifacts so you can confirm what you run without reading the source.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

- **Preferred:** GitHub's private vulnerability reporting — on this repository, go to
  **Security → Report a vulnerability**.
- **Email:** security@orchstep.dev

What to expect:

- We aim to **acknowledge within 3 business days** and to give an initial
  assessment within 10 business days.
- Please give us a reasonable window to ship a fix before public disclosure. We
  will credit reporters who want it.
- In scope: the `orchstep` engine and CLI, released binaries/containers, and the
  module-resolution path. Out of scope: issues that require an already-compromised
  host, and third-party services we don't control.

## Supported versions

Security fixes target the **latest released minor version**. Older versions may
receive fixes at our discretion until a 1.x support policy is published.

## Verifying a release

Every GitHub Release for `orchstep` carries, alongside the binaries:

- `checksums.txt` — SHA-256 of every artifact.
- `checksums.txt.sig` + `checksums.txt.pem` — a **keyless cosign signature** over
  the checksums, tied to our release workflow's identity and recorded in the public
  Sigstore transparency log (Rekor).
- `*.sbom.json` — an **SPDX SBOM** per artifact listing every dependency and license.

### 1. Verify the signature (authenticity + tamper-evidence)

Requires [cosign](https://docs.sigstore.dev/cosign/installation/) (v2+):

```bash
cosign verify-blob checksums.txt \
  --signature checksums.txt.sig \
  --certificate checksums.txt.pem \
  --certificate-identity-regexp 'https://github.com/orchstep/orchstep-pro/.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

A successful verify means the checksums file was produced by our release pipeline
and has not been altered. (The signing identity is our release workflow; it is
published in the transparency log even though the workflow repository is private.)

### 2. Verify your binary against the checksums (integrity)

```bash
sha256sum -c checksums.txt --ignore-missing
```

### 3. Inspect the SBOM (what's inside)

Feed the `*.sbom.json` to a scanner to answer "are we exposed to CVE-X?" or to
review licenses:

```bash
grype sbom:./orchstep_<version>_linux_amd64.tar.gz.sbom.json   # vulnerabilities
# or load it into Dependency-Track / Trivy / your scanner of choice
```

## Roadmap

Build **provenance attestation** (SLSA) is planned as a follow-up to the signing
and SBOM work above.
