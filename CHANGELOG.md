# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

## [Unreleased]

- Added an option to return parsed JSON instead of a Response object.
- Added an option to request JSON, which sets the Accept HTTP header.
- Added an option to send JSON, which sets the HTTP method to POST, sets the
  Content-Type HTTP header, and converts the request body to JSON.
- Added an option to throw an error when the server responds with an
  unsuccessful HTTP status.
- Added an option to continously retry requests when the server responds with a
  429 Too Many Requests HTTP status and includes a Retry-After HTTP header.
- Added the ability to create an instance with default options.

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
[Unreleased]: https://github.com/jordanbtucker/gretchen/commits/main/
