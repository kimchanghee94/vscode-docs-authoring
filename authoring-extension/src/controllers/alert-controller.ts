"use strict";

import * as vscode from "vscode";
import { AlertTags } from "../constants/alert-tags";
import { AlertType } from "../constants/alert-type";
import * as common from "../helper/common";
import { reporter } from "../telemetry/telemetry";

const telemetryCommand: string = "insertAlert";

export function insertAlertCommand() {
    const commands = [
        { command: insertAlert.name, callback: insertAlert },
    ];
    return commands;
}

/**
 * Formats current selection as an alert
 */
export function insertAlert() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!common.isValidEditor(editor, false, "insert alert")) {
        return;
    }

    if (!common.isMarkdownFileCheck(editor, false)) {
        return;
    }

    const alertTypes = [
        "Note – “By the way” info not critical to a task",
        "Important – “Should do” info as best practice; “must do” to complete task",
        "Warning – “Must do” info to avoid significant error",
        "Tip - Shortcut or easy way to perform a task",
    ];
    vscode.window.showQuickPick(alertTypes).then((qpSelection) => {
        const formattedText = format(selectedText, alertTypes.indexOf(qpSelection));
        if (!qpSelection) {
            return;
        }
        common.insertContentToEditor(editor, insertAlert.name, formattedText, true);
        if (qpSelection.startsWith("Note")) {
            reporter.sendTelemetryEvent("command", { command: telemetryCommand + ".note" });
        }
        if (qpSelection.startsWith("Important")) {
            reporter.sendTelemetryEvent("command", { command: telemetryCommand + ".important" });
        }
        if (qpSelection.startsWith("Warning")) {
            reporter.sendTelemetryEvent("command", { command: telemetryCommand + ".warning" });
        }
        if (qpSelection.startsWith("Tip")) {
            reporter.sendTelemetryEvent("command", { command: telemetryCommand + ".tip" });
        }
    });
}

/**
 *  Returns input string formatted as the alert type
 * If input string is an alert of the same type as alertType, it removes the formatting
 * If input string is an alert of different type than alertType
 * It formats the original string as the new alert type
 * @param {string} content - selectedText
 * @param {enum} alertType - type of alert - Note, Important, Warning, Tip
 */

export function format(content: string, alertType: AlertType) {
    const alertPlaceholderText = [
        "“By the way” info not critical to a task",
        "“Should do” info as best practice; “must do” to complete task",
        "“Must do” info to avoid significant error",
        "Shortcut or easy way to perform a task",
    ];
    let selectedText = content;
    if (isAlert(content)) {
        if (getAlertType(content) === alertType) {
            // split the text into paragraphs,
            // remove formatting from each paragraph,
            // remove the first item (which contains the alert type)
            const paragraphsAlert = selectedText.split("\r\n").map((text) => text.substring(2)).slice(1);
            return paragraphsAlert.join("\r\n");
        } else {
            // split the text into paragraphs and remove the first item (which contains the alert type)
            const paragraphsGeneric = selectedText.split("\r\n").slice(1);
            const resultParagraphsGeneric = AlertTags[alertType] + paragraphsGeneric.join("\r\n");
            return resultParagraphsGeneric;
        }
    }
    if (selectedText.length === 0) {
        selectedText = alertPlaceholderText[alertType];
    }

    // split the text into paragraphs and format each paragraph
    const paragraphs = selectedText.split("\r\n").map((text) => "> " + text);
    const result = AlertTags[alertType] + paragraphs.join("\r\n");
    return result;
}

/**
 * Returns the alert type
 * @param {string} content - the string content
 * @return {AlertType} - the type of alert i.e. Note, Warning, Important, Tip
 */
export function getAlertType(content: string) {
    return AlertTags.findIndex((tag) => content.startsWith(tag));
}

/**
 * Checks if the string input is a valid alert
 * @param {string} content - the string content
 * @return {boolean} - true/false the content is an alert
 */
export function isAlert(content: string) {
    // Check if the content starts with an alert tag and if all paragraphs contain the ">" formatter
    if ((AlertTags.some((tag) => content.startsWith(tag))) &&
        (content.split("\n").every((line) => line.startsWith(">")))) {
        return true;
    } else {
        return false;
    }
}