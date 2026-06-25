#! /usr/bin/env tclsh
# Minimal Tcl sample focused on interlinked objects and functions, now namespaced

namespace eval app {
    # Logger represented as a dict (object) with multiple field types
    set logger [dict create name "app-logger" id 1 level "INFO" enabled 1 tags [list core audit]]

    # Backend references the Logger (link by id/name)
    set backend [dict create name "main-backend" logger_id [dict get $logger id] port 8080 secure 0]

    # Function that logs messages using a Logger-like dict
    proc log {logger message level} {
        puts "[dict get $logger name] [$level] $message"
    }

    # Higher-level function that uses the backend and its linked logger
    proc start_backend {backend logger} {
        puts "Starting backend: [dict get $backend name] on port [dict get $backend port]"
        log $logger "Backend started" [dict get $logger level]
    }
}

# Example usage (fully-qualified namespace access)
::app::log $::app::logger "Initializing" "INFO"
::app::start_backend $::app::backend $::app::logger

# End of namespaced Tcl sample
